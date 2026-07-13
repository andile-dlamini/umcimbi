// notification-digest: every 30 minutes. Count-based Tier-2 digest for both sides.
// Counts, per user, "new updates since last_notified_at": unread chat messages
// (excluding first-in-thread), quote declined/expired, new reviews. If count > 0,
// send one digest SMS and stamp last_notified_at.
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
  const now = new Date();
  const nowIso = now.toISOString();
  // 30-min bucket key so the dedup unique index doesn't collide across runs.
  const bucketKey = `digest_${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}_${String(now.getUTCHours()).padStart(2, "0")}${now.getUTCMinutes() < 30 ? "00" : "30"}`;
  const results: unknown[] = [];

  // ---- Planners ----
  const { data: profiles } = await sb.from("profiles").select("user_id, full_name, first_name, phone_number, last_notified_at").limit(2000);
  for (const p of profiles ?? []) {
    const userId = (p as any).user_id as string;
    const since = (p as any).last_notified_at ?? new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // Opt-out check
    const { data: prefs } = await sb.from("notification_preferences").select("sms_enabled").eq("user_id", userId).maybeSingle();
    if ((prefs as any)?.sms_enabled === false) continue;

    // Conversations owned by planner
    const { data: convs } = await sb.from("conversations").select("id").eq("user_id", userId);
    const convIds = (convs ?? []).map((c: any) => c.id);

    let count = 0;

    // Unread vendor messages after `since` (excluding first-in-thread — that's Tier 1)
    if (convIds.length) {
      const { count: msgCount } = await sb
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", convIds)
        .eq("sender_type", "vendor")
        .gt("created_at", since);
      count += msgCount ?? 0;
    }

    // Quote declined/expired for this planner's requests since `since`
    const { data: srIds } = await sb.from("service_requests").select("id").eq("requester_user_id", userId);
    if ((srIds ?? []).length) {
      const ids = (srIds as any[]).map((r) => r.id);
      const { count: qc } = await sb
        .from("quotes")
        .select("id", { count: "exact", head: true })
        .in("request_id", ids)
        .in("status", ["declined", "expired"])
        .gt("updated_at", since);
      count += qc ?? 0;
    }

    if (count <= 0) continue;

    const { error: dupErr } = await sb.from("sms_notification_log").insert({
      user_id: userId, user_type: "planner",
      event_type: bucketKey,
      tier: "tier2", related_id: null, phone: (p as any).phone_number,
    });
    if (dupErr && String(dupErr.code) === "23505") continue;

    const phoneNoPlus = normalizeSaPhone((p as any).phone_number);
    if (!phoneNoPlus) continue;
    const body = renderSms("digest", { name: (p as any).first_name ?? (p as any).full_name, count });
    const res = await sendConnectMobileSms(phoneNoPlus, body, `digest_p_${userId.slice(0, 8)}_${Date.now()}`.slice(0, 60));
    if (res.ok) {
      await sb.from("profiles").update({ last_notified_at: nowIso }).eq("user_id", userId);
    }
    results.push({ planner: userId, count, sent: res.ok });
  }

  // ---- Vendors (no dormancy gate on digest per plan) ----
  const { data: vendors } = await sb.from("vendors").select("id, owner_user_id, name, phone_number, is_demo, last_notified_at").eq("is_demo", false);
  for (const v of vendors ?? []) {
    const ownerId = (v as any).owner_user_id as string | null;
    if (!ownerId) continue;
    const since = (v as any).last_notified_at ?? new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: prefs } = await sb.from("notification_preferences").select("sms_enabled").eq("user_id", ownerId).maybeSingle();
    if ((prefs as any)?.sms_enabled === false) continue;

    // Conversations for this vendor
    const { data: convs } = await sb.from("conversations").select("id").eq("vendor_id", (v as any).id);
    const convIds = (convs ?? []).map((c: any) => c.id);

    let count = 0;
    if (convIds.length) {
      const { count: msgCount } = await sb
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", convIds)
        .eq("sender_type", "user")
        .gt("created_at", since);
      count += msgCount ?? 0;
    }

    // New reviews since `since`
    const { count: rc } = await sb
      .from("vendor_reviews")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", (v as any).id)
      .gt("created_at", since);
    count += rc ?? 0;

    if (count <= 0) continue;

    const { data: prof } = await sb.from("profiles").select("full_name, first_name, phone_number").eq("user_id", ownerId).maybeSingle();
    const phone = (prof as any)?.phone_number ?? (v as any).phone_number ?? null;

    const { error: dupErr } = await sb.from("sms_notification_log").insert({
      user_id: ownerId, user_type: "vendor",
      event_type: bucketKey, tier: "tier2", related_id: null, phone,
    });
    if (dupErr && String(dupErr.code) === "23505") continue;

    const phoneNoPlus = normalizeSaPhone(phone);
    if (!phoneNoPlus) continue;
    const name = (prof as any)?.first_name ?? (prof as any)?.full_name ?? (v as any).name ?? null;
    const body = renderSms("digest", { name, count });
    const res = await sendConnectMobileSms(phoneNoPlus, body, `digest_v_${(v as any).id.slice(0, 8)}_${Date.now()}`.slice(0, 60));
    if (res.ok) {
      await sb.from("vendors").update({ last_notified_at: nowIso }).eq("id", (v as any).id);
    }
    results.push({ vendor: (v as any).id, count, sent: res.ok });
  }

  return json({ processed: results.length, results });
});
