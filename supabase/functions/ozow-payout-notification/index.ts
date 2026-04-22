import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-access-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SENSITIVE_KEYS = ["accesstoken", "access_token", "authorization", "accountnumber", "account_number", "branchcode", "branch_code", "bankaccountnumber", "bankbranchcode", "bankdetails"];

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isSensitiveKey(key: string) {
  const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, "");
  return SENSITIVE_KEYS.some((sensitive) => normalized.includes(sensitive));
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, isSensitiveKey(key) ? "[REDACTED]" : redactValue(nested)])
    );
  }
  return value;
}

function redactHeaders(headers: Headers) {
  return Object.fromEntries([...headers.entries()].map(([key, value]) => [key, isSensitiveKey(key) ? "[REDACTED]" : value]));
}

async function parsePayload(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return await req.json();
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    return Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)]));
  }
  const text = await req.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return Object.fromEntries(new URLSearchParams(text));
  }
}

function getToken(req: Request, payload: Record<string, unknown>) {
  const auth = req.headers.get("authorization") ?? "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return String(req.headers.get("x-access-token") ?? payload.AccessToken ?? payload.accessToken ?? payload.access_token ?? "").trim();
}

function normalizeStatus(status: string) {
  const value = status.toLowerCase();
  if (["paid", "completed", "successful", "success", "processed"].includes(value)) return "paid";
  if (["failed", "error", "unsuccessful"].includes(value)) return "failed";
  if (["rejected", "declined", "cancelled", "canceled"].includes(value)) return "rejected";
  if (["submitted", "queued", "processing", "inprogress", "in_progress"].includes(value)) return "submitted";
  return "pending";
}

function extractRefs(payload: Record<string, unknown>) {
  return {
    status: String(payload.Status ?? payload.status ?? payload.PayoutStatus ?? payload.payoutStatus ?? "pending"),
    internalReference: String(payload.InternalReference ?? payload.internalReference ?? payload.internal_reference ?? payload.PayoutReference ?? payload.payoutReference ?? payload.Reference ?? payload.reference ?? "").trim(),
    ozowReference: String(payload.OzowReference ?? payload.ozowReference ?? payload.OzowPayoutReference ?? payload.ozowPayoutReference ?? "").trim(),
    ozowPayoutId: String(payload.OzowPayoutId ?? payload.ozowPayoutId ?? payload.PayoutId ?? payload.payoutId ?? "").trim(),
    failureReason: String(payload.FailureReason ?? payload.failureReason ?? payload.ErrorMessage ?? payload.errorMessage ?? payload.Message ?? payload.message ?? "").trim(),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const configuredToken = (Deno.env.get("OZOW_PAYOUT_ACCESS_TOKEN") ?? "").trim();
    if (!configuredToken) return jsonResponse({ error: "Notification unavailable" }, 500);

    const payload = await parsePayload(req);
    const token = getToken(req, payload);
    if (!token || token !== configuredToken) return jsonResponse({ error: "Unauthorized" }, 401);

    const refs = extractRefs(payload);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let payoutQuery = supabase.from("vendor_payouts").select("id");
    const filters = [refs.internalReference && `internal_reference.eq.${refs.internalReference}`, refs.ozowReference && `ozow_reference.eq.${refs.ozowReference}`, refs.ozowPayoutId && `ozow_payout_id.eq.${refs.ozowPayoutId}`].filter(Boolean).join(",");
    if (!filters) return jsonResponse({ error: "Missing payout reference" }, 400);

    const { data: payout, error: payoutError } = await payoutQuery.or(filters).maybeSingle();
    if (payoutError || !payout) return jsonResponse({ error: "Payout not found" }, 404);

    const normalizedStatus = normalizeStatus(refs.status);
    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      status: normalizedStatus,
      response_payload: redactValue(payload),
      ...(refs.ozowPayoutId ? { ozow_payout_id: refs.ozowPayoutId } : {}),
      ...(refs.ozowReference ? { ozow_reference: refs.ozowReference } : {}),
      ...(refs.failureReason && ["failed", "rejected"].includes(normalizedStatus) ? { failure_reason: refs.failureReason } : {}),
      ...(normalizedStatus === "paid" ? { paid_at: now } : {}),
      ...(["failed", "rejected"].includes(normalizedStatus) ? { failed_at: now } : {}),
      ...(normalizedStatus === "submitted" ? { submitted_at: now } : {}),
    };

    await supabase.from("payout_webhook_events").insert({
      vendor_payout_id: payout.id,
      event_type: "notification",
      ozow_status: refs.status,
      raw_payload: null,
      redacted_payload: redactValue(payload),
      headers_redacted: redactHeaders(req.headers),
    });

    const { error: updateError } = await supabase.from("vendor_payouts").update(updatePayload).eq("id", payout.id);
    if (updateError) return jsonResponse({ error: "Failed to update payout" }, 500);

    return jsonResponse({ success: true, status: normalizedStatus, vendor_payout_id: payout.id });
  } catch (err) {
    console.error("ozow-payout-notification error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});