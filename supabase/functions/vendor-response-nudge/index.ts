// vendor-response-nudge: hourly cron. Finds pending service_requests older than
// 4 hours that the vendor has not responded to, and sends a response_nudge SMS
// (dormancy-gated, opt-out respected, deduped per service_request).
// NOTE: This function is a warning nudge only. It MUST NOT modify
// service_requests.expires_at — the request still runs its full 48-hour lifecycle.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { renderSms, normalizeSaPhone, sendConnectMobileSms } from "../_shared/smsTemplates.ts";
import { isInternalCall } from "../_shared/internalAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (!isInternalCall(req)) return json({ error: "Unauthorized" }, 401);

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
  const fourHoursAgo = new Date(Date.now() - 4 * 3600 * 1000).toISOString();

  const { data: pending, error } = await sb
    .from("service_requests")
    .select("id, vendor_id, created_at")
    .eq("status", "pending")
    .lt("created_at", fourHoursAgo)
    .limit(500);

  if (error) return json({ error: error.message }, 500);
  const results: unknown[] = [];

  for (const sr of pending ?? []) {
    const srId = (sr as any).id as string;
    const vendorId = (sr as any).vendor_id as string | null;
    if (!vendorId) continue;

    // Resolve vendor recipient (same pattern as notify-vendor-event resolveVendorRecipient)
    const { data: v } = await sb.from("vendors")
      .select("id, owner_user_id, name, phone_number, is_demo, dormant_nudge_count")
      .eq("id", vendorId).maybeSingle();
    if (!v || !(v as any).owner_user_id || (v as any).is_demo) continue;
    const ownerId = (v as any).owner_user_id as string;

    // Opt-out
    const { data: prefs } = await sb.from("notification_preferences")
      .select("sms_enabled").eq("user_id", ownerId).maybeSingle();
    if ((prefs as any)?.sms_enabled === false) continue;

    // Dedup: one nudge per service_request
    const { data: existing } = await sb.from("sms_notification_log")
      .select("id")
      .eq("user_id", ownerId)
      .eq("event_type", "response_nudge")
      .eq("related_id", srId)
      .maybeSingle();
    if (existing) continue;

    const { data: prof } = await sb.from("profiles")
      .select("full_name, first_name, phone_number")
      .eq("user_id", ownerId).maybeSingle();
    const phone = (prof as any)?.phone_number ?? (v as any).phone_number ?? null;
    const name = (prof as any)?.first_name ?? (prof as any)?.full_name ?? (v as any).name ?? null;

    // Dormancy gate
    const { data: lsi } = await sb.rpc("get_vendor_last_sign_in", { _vendor_id: vendorId });
    const last = lsi ? new Date(lsi as string).getTime() : 0;
    const blocked = last < Date.now() - 60 * 86400_000 && ((v as any).dormant_nudge_count ?? 0) >= 3;

    if (blocked) {
      await sb.from("sms_notification_log").insert({
        user_id: ownerId, user_type: "vendor",
        event_type: "response_nudge__suppressed_dormant",
        tier: "suppressed", related_id: srId, phone_number: phone,
      });
      results.push({ service_request: srId, skipped: "dormant" });
      continue;
    }

    const { error: dupErr } = await sb.from("sms_notification_log").insert({
      user_id: ownerId, user_type: "vendor",
      event_type: "response_nudge", tier: "tier1", related_id: srId, phone_number: phone,
    });
    if (dupErr) { results.push({ service_request: srId, skipped: "dup_or_error" }); continue; }

    const phoneNoPlus = normalizeSaPhone(phone);
    if (!phoneNoPlus) { results.push({ service_request: srId, skipped: "invalid_phone" }); continue; }

    const body = renderSms("response_nudge", { name });
    const res = await sendConnectMobileSms(phoneNoPlus, body, `nudge_${srId}`.slice(0, 60));
    if (res.ok) {
      await sb.from("vendors").update({
        dormant_nudge_count: ((v as any).dormant_nudge_count ?? 0) + 1,
        last_nudge_sent_at: new Date().toISOString(),
        last_notified_at: new Date().toISOString(),
      }).eq("id", vendorId);
    }
    results.push({ service_request: srId, sent: res.ok });
  }

  return json({ processed: results.length, results });
});
