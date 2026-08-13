// notify-vendor-event: routes Tier 1 events to the correct recipient(s).
// Requires service-role Bearer.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { renderSms, normalizeSaPhone, sendConnectMobileSms, SmsEvent } from "../_shared/smsTemplates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function authOk(req: Request) {
  const h = req.headers.get("Authorization") ?? "";
  const token = h.replace(/^Bearer\s+/i, "").trim();
  return token && token === SERVICE_ROLE;
}

type VendorEvent =
  | "new_service_request"
  | "quote_sent"
  | "quote_accepted"
  | "deposit_paid"
  | "balance_paid"
  | "delivery_uploaded"
  | "payout_released"
  | "dispute_raised";

interface Recipient {
  user_id: string;
  user_type: "vendor" | "planner";
  phone: string | null;
  name: string | null;
  vendor_id?: string;
}

async function loadPrefs(sb: ReturnType<typeof createClient>, userId: string) {
  const { data } = await sb.from("notification_preferences").select("sms_enabled").eq("user_id", userId).maybeSingle();
  return data?.sms_enabled !== false;
}

async function isDormantBlocked(sb: ReturnType<typeof createClient>, vendorId: string, dormantCount: number) {
  const { data } = await sb.rpc("get_vendor_last_sign_in", { _vendor_id: vendorId });
  const lastSignIn = data ? new Date(data as string).getTime() : 0;
  const sixtyDaysAgo = Date.now() - 60 * 24 * 3600 * 1000;
  return lastSignIn < sixtyDaysAgo && dormantCount >= 3;
}

async function logSms(sb: ReturnType<typeof createClient>, row: {
  user_id: string; user_type: "vendor" | "planner"; event_type: string; tier: "tier1" | "tier2" | "suppressed";
  related_id?: string | null; phone_number?: string | null; provider_response?: string | null;
}) {
  const { data, error } = await sb.from("sms_notification_log").insert(row).select("id").maybeSingle();
  // unique-index violation ⇒ duplicate ⇒ treat as success
  return { inserted: !error, duplicate: !!error && String(error.code) === "23505", id: (data as any)?.id ?? null };
}


async function sendAndBump(
  sb: ReturnType<typeof createClient>,
  event: SmsEvent,
  recipient: Recipient,
  eventType: string,
  relatedId: string | null,
) {
  if (!recipient.phone) {
    return json({ skipped: "no_phone" });
  }
  if (!(await loadPrefs(sb, recipient.user_id))) {
    return json({ skipped: "opted_out" });
  }

  // Vendor-facing dormancy gate
  if (recipient.user_type === "vendor" && recipient.vendor_id) {
    const { data: v } = await sb.from("vendors").select("dormant_nudge_count,is_demo").eq("id", recipient.vendor_id).maybeSingle();
    if (v?.is_demo) return json({ skipped: "demo" });
    if (v && await isDormantBlocked(sb, recipient.vendor_id, (v as any).dormant_nudge_count ?? 0)) {
      await logSms(sb, {
        user_id: recipient.user_id, user_type: "vendor",
        event_type: `${eventType}__suppressed_dormant`,
        tier: "suppressed", related_id: relatedId, phone_number: recipient.phone,
      });
      return json({ skipped: "dormant" });
    }
  }

  // Idempotent log-first
  const logRes = await logSms(sb, {
    user_id: recipient.user_id, user_type: recipient.user_type,
    event_type: eventType, tier: "tier1", related_id: relatedId, phone_number: recipient.phone,
  });
  if (logRes.duplicate) return json({ skipped: "duplicate" });

  const phoneNoPlus = normalizeSaPhone(recipient.phone);
  if (!phoneNoPlus) return json({ skipped: "invalid_phone" });

  const body = renderSms(event, { name: recipient.name });
  const msgId = `${eventType}_${relatedId ?? "x"}_${Date.now()}`.slice(0, 60);
  const smsRes = await sendConnectMobileSms(phoneNoPlus, body, msgId);

  if (recipient.user_type === "vendor" && recipient.vendor_id && smsRes.ok) {
    await sb.from("vendors").update({
      dormant_nudge_count: ((await sb.from("vendors").select("dormant_nudge_count").eq("id", recipient.vendor_id).maybeSingle()).data?.dormant_nudge_count ?? 0) + 1,
      last_nudge_sent_at: new Date().toISOString(),
      last_notified_at: new Date().toISOString(),
    }).eq("id", recipient.vendor_id);
  } else if (recipient.user_type === "planner" && smsRes.ok) {
    await sb.from("profiles").update({ last_notified_at: new Date().toISOString() }).eq("user_id", recipient.user_id);
  }

  return json({ sent: smsRes.ok, status: smsRes.status });
}

async function resolveVendorRecipient(sb: ReturnType<typeof createClient>, vendorId: string): Promise<Recipient | null> {
  const { data: v } = await sb.from("vendors").select("id, owner_user_id, name, phone_number").eq("id", vendorId).maybeSingle();
  if (!v || !(v as any).owner_user_id) return null;
  const { data: p } = await sb.from("profiles").select("full_name, first_name, phone_number").eq("user_id", (v as any).owner_user_id).maybeSingle();
  return {
    user_id: (v as any).owner_user_id,
    user_type: "vendor",
    phone: (p as any)?.phone_number ?? (v as any).phone_number ?? null,
    name: (p as any)?.first_name ?? (p as any)?.full_name ?? (v as any).name ?? null,
    vendor_id: vendorId,
  };
}

async function resolvePlannerRecipient(sb: ReturnType<typeof createClient>, userId: string): Promise<Recipient | null> {
  const { data: p } = await sb.from("profiles").select("full_name, first_name, phone_number").eq("user_id", userId).maybeSingle();
  if (!p) return null;
  return {
    user_id: userId, user_type: "planner",
    phone: (p as any).phone_number ?? null,
    name: (p as any).first_name ?? (p as any).full_name ?? null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (!authOk(req)) return json({ error: "Unauthorized" }, 401);

  try {
    const body = await req.json();
    const eventType = body.event_type as VendorEvent;
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

    switch (eventType) {
      case "new_service_request": {
        const { data: sr } = await sb.from("service_requests").select("id, vendor_id").eq("id", body.service_request_id).maybeSingle();
        if (!sr) return json({ error: "service_request not found" }, 404);
        const r = await resolveVendorRecipient(sb, (sr as any).vendor_id);
        if (!r) return json({ skipped: "no_vendor_owner" });
        return await sendAndBump(sb, "new_service_request", r, "new_service_request", (sr as any).id);
      }
      case "quote_sent": {
        const { data: q } = await sb.from("quotes").select("id, request_id").eq("id", body.quote_id).maybeSingle();
        if (!q) return json({ error: "quote not found" }, 404);
        const { data: sr } = await sb.from("service_requests").select("requester_user_id").eq("id", (q as any).request_id).maybeSingle();
        if (!sr) return json({ error: "sr not found" }, 404);
        const r = await resolvePlannerRecipient(sb, (sr as any).requester_user_id);
        if (!r) return json({ skipped: "no_planner" });
        return await sendAndBump(sb, "quote_sent", r, "quote_sent", (q as any).id);
      }
      case "quote_accepted": {
        const { data: b } = await sb.from("bookings").select("id, vendor_id").eq("id", body.booking_id).maybeSingle();
        if (!b) return json({ error: "booking not found" }, 404);
        const r = await resolveVendorRecipient(sb, (b as any).vendor_id);
        if (!r) return json({ skipped: "no_vendor_owner" });
        return await sendAndBump(sb, "quote_accepted", r, "quote_accepted", (b as any).id);
      }
      case "deposit_paid": {
        const { data: bk } = await sb.from("bookings").select("id, vendor_id, client_id").eq("id", body.booking_id).maybeSingle();
        if (!bk) return json({ error: "booking not found" }, 404);
        const vr = await resolveVendorRecipient(sb, (bk as any).vendor_id);
        const pr = await resolvePlannerRecipient(sb, (bk as any).client_id);
        const results: unknown[] = [];
        if (vr) results.push(await (await sendAndBump(sb, "deposit_paid_vendor", vr, "deposit_paid_vendor", (bk as any).id)).json());
        if (pr) results.push(await (await sendAndBump(sb, "deposit_confirmed_planner", pr, "deposit_confirmed_planner", (bk as any).id)).json());
        return json({ results });
      }
      case "balance_paid": {
        const { data: bk } = await sb.from("bookings").select("id, vendor_id").eq("id", body.booking_id).maybeSingle();
        if (!bk) return json({ error: "booking not found" }, 404);
        const vr = await resolveVendorRecipient(sb, (bk as any).vendor_id);
        if (!vr) return json({ skipped: "no_vendor_owner" });
        return await sendAndBump(sb, "balance_paid_vendor", vr, "balance_paid_vendor", (bk as any).id);
      }
      case "delivery_uploaded": {
        const { data: bk } = await sb.from("bookings").select("id, client_id").eq("id", body.booking_id).maybeSingle();
        if (!bk) return json({ error: "booking not found" }, 404);
        const pr = await resolvePlannerRecipient(sb, (bk as any).client_id);
        if (!pr) return json({ skipped: "no_planner" });
        return await sendAndBump(sb, "delivery_uploaded", pr, "delivery_uploaded", (bk as any).id);
      }
      case "payout_released": {
        const { data: p } = await sb.from("vendor_payouts").select("id, vendor_id").eq("id", body.vendor_payout_id).maybeSingle();
        if (!p) return json({ error: "payout not found" }, 404);
        const r = await resolveVendorRecipient(sb, (p as any).vendor_id);
        if (!r) return json({ skipped: "no_vendor_owner" });
        return await sendAndBump(sb, "payout_released", r, "payout_released", (p as any).id);
      }
      case "dispute_raised": {
        const { data: bk } = await sb.from("bookings").select("id, vendor_id, client_id").eq("id", body.booking_id).maybeSingle();
        if (!bk) return json({ error: "booking not found" }, 404);
        const vr = await resolveVendorRecipient(sb, (bk as any).vendor_id);
        const pr = await resolvePlannerRecipient(sb, (bk as any).client_id);
        const results: unknown[] = [];
        if (vr) results.push(await (await sendAndBump(sb, "dispute_raised_vendor", vr, "dispute_raised_vendor", (bk as any).id)).json());
        if (pr) results.push(await (await sendAndBump(sb, "dispute_raised_planner", pr, "dispute_raised_planner", (bk as any).id)).json());
        return json({ results });
      }
      default:
        return json({ error: "Unknown event_type" }, 400);
    }
  } catch (err) {
    console.error("notify-vendor-event error:", err);
    return json({ error: "Internal error" }, 500);
  }
});
