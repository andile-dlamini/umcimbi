// vendor-response-nudge: hourly cron. Finds conversations where the last message is
// from a planner (user), older than 4 hours, no vendor reply after, and no nudge sent
// for that conversation yet. Sends response_nudge to the vendor (dormancy-gated).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { renderSms, normalizeSaPhone, sendConnectMobileSms } from "../_shared/smsTemplates.ts";

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
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (token !== SERVICE_ROLE) return json({ error: "Unauthorized" }, 401);

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
  const fourHoursAgo = new Date(Date.now() - 4 * 3600 * 1000).toISOString();

  // Reuse existing helper: get_stalled_conversations requires admin JWT, so query directly.
  const { data: convs, error } = await sb
    .from("conversations")
    .select("id, vendor_id, last_message_at")
    .lt("last_message_at", fourHoursAgo)
    .limit(200);

  if (error) return json({ error: error.message }, 500);
  const results: unknown[] = [];

  for (const c of convs ?? []) {
    const { data: lastMsg } = await sb
      .from("messages")
      .select("sender_type, created_at")
      .eq("conversation_id", (c as any).id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!lastMsg || (lastMsg as any).sender_type !== "user") continue;

    const { data: v } = await sb.from("vendors")
      .select("id, owner_user_id, name, phone_number, is_demo, dormant_nudge_count")
      .eq("id", (c as any).vendor_id).maybeSingle();
    if (!v || !(v as any).owner_user_id || (v as any).is_demo) continue;
    const ownerId = (v as any).owner_user_id as string;

    const { data: prefs } = await sb.from("notification_preferences").select("sms_enabled").eq("user_id", ownerId).maybeSingle();
    if ((prefs as any)?.sms_enabled === false) continue;

    // dedup: one nudge per conversation
    const { data: existing } = await sb.from("sms_notification_log")
      .select("id").eq("user_id", ownerId).eq("event_type", "response_nudge").eq("related_id", (c as any).id).maybeSingle();
    if (existing) continue;

    // dormancy
    const { data: lsi } = await sb.rpc("get_vendor_last_sign_in", { _vendor_id: (v as any).id });
    const last = lsi ? new Date(lsi as string).getTime() : 0;
    const blocked = last < Date.now() - 60 * 86400_000 && ((v as any).dormant_nudge_count ?? 0) >= 3;

    const { data: prof } = await sb.from("profiles").select("full_name, first_name, phone_number").eq("user_id", ownerId).maybeSingle();
    const phone = (prof as any)?.phone_number ?? (v as any).phone_number ?? null;
    const name = (prof as any)?.first_name ?? (prof as any)?.full_name ?? (v as any).name ?? null;

    if (blocked) {
      await sb.from("sms_notification_log").insert({
        user_id: ownerId, user_type: "vendor",
        event_type: "response_nudge__suppressed_dormant",
        tier: "suppressed", related_id: (c as any).id, phone,
      });
      results.push({ conv: (c as any).id, skipped: "dormant" });
      continue;
    }

    const { error: dupErr } = await sb.from("sms_notification_log").insert({
      user_id: ownerId, user_type: "vendor",
      event_type: "response_nudge", tier: "tier1", related_id: (c as any).id, phone,
    });
    if (dupErr) { results.push({ conv: (c as any).id, skipped: "dup_or_error" }); continue; }

    const phoneNoPlus = normalizeSaPhone(phone);
    if (!phoneNoPlus) { results.push({ conv: (c as any).id, skipped: "invalid_phone" }); continue; }
    const body = renderSms("response_nudge", { name });
    const res = await sendConnectMobileSms(phoneNoPlus, body, `nudge_${(c as any).id}`.slice(0, 60));
    if (res.ok) {
      await sb.from("vendors").update({
        dormant_nudge_count: ((v as any).dormant_nudge_count ?? 0) + 1,
        last_nudge_sent_at: new Date().toISOString(),
        last_notified_at: new Date().toISOString(),
      }).eq("id", (v as any).id);
    }
    results.push({ conv: (c as any).id, sent: res.ok });
  }

  return json({ processed: results.length, results });
});
