// notify-first-message: sends first-chat SMS to the recipient (opposite side of sender).
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

  try {
    const { conversation_id, sender_type, message_id } = await req.json();
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: conv } = await sb.from("conversations").select("id, user_id, vendor_id").eq("id", conversation_id).maybeSingle();
    if (!conv) return json({ error: "conversation not found" }, 404);

    // Recipient = opposite side of sender
    if (sender_type === "user") {
      // send to vendor owner
      const { data: v } = await sb.from("vendors").select("id, owner_user_id, name, phone_number, is_demo, dormant_nudge_count").eq("id", (conv as any).vendor_id).maybeSingle();
      if (!v || !(v as any).owner_user_id) return json({ skipped: "no_vendor_owner" });
      if ((v as any).is_demo) return json({ skipped: "demo" });
      const ownerId = (v as any).owner_user_id as string;
      const { data: prefs } = await sb.from("notification_preferences").select("sms_enabled").eq("user_id", ownerId).maybeSingle();
      if ((prefs as any)?.sms_enabled === false) return json({ skipped: "opted_out" });

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
          event_type: "first_message_to_vendor__suppressed_dormant",
          tier: "suppressed", related_id: conversation_id, phone,
        });
        return json({ skipped: "dormant" });
      }

      const { error: dupErr } = await sb.from("sms_notification_log").insert({
        user_id: ownerId, user_type: "vendor",
        event_type: "first_message_to_vendor",
        tier: "tier1", related_id: conversation_id, phone,
      });
      if (dupErr && String(dupErr.code) === "23505") return json({ skipped: "duplicate" });

      const phoneNoPlus = normalizeSaPhone(phone);
      if (!phoneNoPlus) return json({ skipped: "invalid_phone" });
      const body = renderSms("first_message_to_vendor", { name });
      const res = await sendConnectMobileSms(phoneNoPlus, body, `firstmsg_${message_id}`.slice(0, 60));
      if (res.ok) {
        await sb.from("vendors").update({
          dormant_nudge_count: ((v as any).dormant_nudge_count ?? 0) + 1,
          last_nudge_sent_at: new Date().toISOString(),
          last_notified_at: new Date().toISOString(),
        }).eq("id", (v as any).id);
      }
      return json({ sent: res.ok });
    } else if (sender_type === "vendor") {
      // send to planner
      const plannerId = (conv as any).user_id as string;
      const { data: prefs } = await sb.from("notification_preferences").select("sms_enabled").eq("user_id", plannerId).maybeSingle();
      if ((prefs as any)?.sms_enabled === false) return json({ skipped: "opted_out" });
      const { data: prof } = await sb.from("profiles").select("full_name, first_name, phone_number").eq("user_id", plannerId).maybeSingle();
      if (!prof) return json({ skipped: "no_profile" });
      const phone = (prof as any).phone_number;
      const { error: dupErr } = await sb.from("sms_notification_log").insert({
        user_id: plannerId, user_type: "planner",
        event_type: "first_message_to_planner",
        tier: "tier1", related_id: conversation_id, phone,
      });
      if (dupErr && String(dupErr.code) === "23505") return json({ skipped: "duplicate" });

      const phoneNoPlus = normalizeSaPhone(phone);
      if (!phoneNoPlus) return json({ skipped: "invalid_phone" });
      const body = renderSms("first_message_to_planner", { name: (prof as any).first_name ?? (prof as any).full_name });
      const res = await sendConnectMobileSms(phoneNoPlus, body, `firstmsg_${message_id}`.slice(0, 60));
      if (res.ok) {
        await sb.from("profiles").update({ last_notified_at: new Date().toISOString() }).eq("user_id", plannerId);
      }
      return json({ sent: res.ok });
    }

    return json({ skipped: "unknown_sender" });
  } catch (err) {
    console.error("notify-first-message error:", err);
    return json({ error: "Internal error" }, 500);
  }
});
