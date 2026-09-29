// organiser-activation-nudge: hourly cron. Finds real organisers who signed up
// more than 24 hours ago and have done nothing we can observe — no ceremony, no
// conversation, no quote request, no search — and sends a one-time
// activation_nudge_24h SMS.
//
// Funnel context: this targets leak #1 (signup -> first action), where more than
// half of real organisers go quiet immediately after registering.
//
// Selection lives in the get_dormant_organisers() RPC so the "real organiser"
// definition stays identical to get_admin_activation_stats() on the admin
// dashboard. See supabase/migrations/20260929120000_organiser_activation_nudge.sql.
//
// One nudge per organiser, ever. Deduped by sms_notification_log's unique index
// on (user_id, event_type, COALESCE(related_id, zero-uuid)) — we insert the log
// row BEFORE sending, so a duplicate key error means someone else already has it.
//
// BATCH_LIMIT exists because most dormant signups are historical: an unbounded
// first run would SMS the entire backlog in one hour. Raise it deliberately.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { renderSms, normalizeSaPhone, sendConnectMobileSms } from "../_shared/smsTemplates.ts";
import { isInternalCall } from "../_shared/internalAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MIN_AGE_HOURS = 24;
const MAX_AGE_DAYS = 60;
const BATCH_LIMIT = 25;

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (!isInternalCall(req)) return json({ error: "Unauthorized" }, 401);

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Allow a manual invocation to override the batch size / backfill window,
  // e.g. {"limit": 5} for a smoke test before letting the cron run wide.
  let opts: { limit?: number; min_age_hours?: number; max_age_days?: number } = {};
  try {
    opts = await req.json();
  } catch {
    // cron posts '{}' — and an empty body is fine too
  }

  const { data: dormant, error } = await sb.rpc("get_dormant_organisers", {
    _min_age_hours: opts.min_age_hours ?? MIN_AGE_HOURS,
    _max_age_days: opts.max_age_days ?? MAX_AGE_DAYS,
    _limit: opts.limit ?? BATCH_LIMIT,
  });

  if (error) return json({ error: error.message }, 500);

  const results: unknown[] = [];

  for (const o of dormant ?? []) {
    const userId = (o as any).user_id as string;
    const rawPhone = (o as any).phone_number as string | null;
    const name = (o as any).first_name ?? (o as any).full_name ?? null;

    // Opt-out. Absent row means default-on, matching vendor-response-nudge.
    const { data: prefs } = await sb.from("notification_preferences")
      .select("sms_enabled").eq("user_id", userId).maybeSingle();
    if ((prefs as any)?.sms_enabled === false) {
      results.push({ user: userId, skipped: "opted_out" });
      continue;
    }

    const phoneNoPlus = normalizeSaPhone(rawPhone);
    if (!phoneNoPlus) {
      results.push({ user: userId, skipped: "invalid_phone" });
      continue;
    }

    // Claim the nudge first: the unique dedup index makes this the lock.
    // related_id stays NULL — one activation nudge per organiser for all time.
    const { error: dupErr } = await sb.from("sms_notification_log").insert({
      user_id: userId,
      // 'planner' not 'organiser': sms_notification_log has a CHECK constraint
      // limiting user_type to ('vendor','planner'). Same population, older name.
      user_type: "planner",
      event_type: "activation_nudge_24h",
      tier: "tier2",
      related_id: null,
      phone_number: rawPhone,
    });
    if (dupErr) {
      results.push({ user: userId, skipped: "dup_or_error" });
      continue;
    }

    const body = renderSms("activation_nudge_24h", { name });
    const res = await sendConnectMobileSms(phoneNoPlus, body, `act_${userId}`.slice(0, 60));

    if (res.ok) {
      await sb.from("profiles")
        .update({ last_notified_at: new Date().toISOString() })
        .eq("user_id", userId);
    } else {
      // Keep the provider's reason on the log row we already claimed, so a
      // failed send is visible rather than looking like a successful nudge.
      await sb.from("sms_notification_log")
        .update({ provider_response: res.response })
        .eq("user_id", userId)
        .eq("event_type", "activation_nudge_24h");
    }

    results.push({ user: userId, sent: res.ok });
  }

  return json({ processed: results.length, results });
});
