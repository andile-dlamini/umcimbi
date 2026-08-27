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
    status: (() => {
      const ps = (payload.PayoutStatus ?? payload.payoutStatus) as Record<string, unknown> | undefined;
      if (ps && typeof ps === "object") {
        const code = Number(ps.Status ?? ps.status ?? 0);
        if (code === 5) return "paid";
        if (code === 99) return "rejected";
        if (code === 4) return "failed";
        if (code === 3 || code === 1 || code === 2) return "submitted";
        return "pending";
      }
      return String(payload.Status ?? payload.status ?? "pending");
    })(),
    internalReference: String(payload.InternalReference ?? payload.internalReference ?? payload.internal_reference ?? payload.PayoutReference ?? payload.payoutReference ?? payload.Reference ?? payload.reference ?? "").trim(),
    ozowReference: String(payload.OzowReference ?? payload.ozowReference ?? payload.OzowPayoutReference ?? payload.ozowPayoutReference ?? "").trim(),
    ozowPayoutId: String(payload.OzowPayoutId ?? payload.ozowPayoutId ?? payload.PayoutId ?? payload.payoutId ?? "").trim(),
    merchantReference: String(payload.MerchantReference ?? payload.merchantReference ?? payload.merchant_reference ?? "").trim(),
    customerBankReference: String(payload.CustomerBankReference ?? payload.customerBankReference ?? payload.customer_bank_reference ?? "").trim(),
    failureReason: String(payload.FailureReason ?? payload.failureReason ?? payload.ErrorMessage ?? payload.errorMessage ?? payload.Message ?? payload.message ?? "").trim(),
  };
}

// DO NOT ADD AUTH/TOKEN VALIDATION TO THIS ENDPOINT.
// Ozow's payout notification webhook sends no merchant-side auth token or header.
// This was confirmed directly by Ozow support (Teyla) during staging tests, and the
// auth check was removed for that reason on 2026-05-05, tested end-to-end successfully.
// It was mistakenly reintroduced on 2026-05-21 during an unrelated security-hardening
// pass (bundled with admin-daily-brief, release-escrow, seed-demo-users), which broke
// every PayoutCompleted callback silently for ~3 months until caught on 2026-08-26 via
// manual reconciliation of order UMC-O-2026-000038.
// If this endpoint needs stronger protection later, use an IP allowlist of Ozow's
// notification egress ranges instead — never a shared-secret token check here.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  let payload: Record<string, unknown> = {};
  let parseError: unknown = null;
  try {
    payload = (await parsePayload(req)) as Record<string, unknown>;
  } catch (err) {
    parseError = err;
  }

  if (parseError) {
    console.error("ozow-payout-notification parse error:", parseError);
    return jsonResponse({ error: "Invalid payload" }, 400);
  }

  try {
    const refs = extractRefs(payload);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const payoutQuery = supabase.from("vendor_payouts").select("id");
    const refCandidates = [refs.internalReference, refs.ozowReference, refs.ozowPayoutId, refs.merchantReference, refs.customerBankReference].filter(Boolean);
    const filters = [
      refs.internalReference && `internal_reference.eq.${refs.internalReference}`,
      refs.ozowReference && `ozow_reference.eq.${refs.ozowReference}`,
      refs.ozowPayoutId && `ozow_payout_id.eq.${refs.ozowPayoutId}`,
      ...refCandidates.flatMap((ref) => [`internal_reference.eq.${ref}`, `ozow_reference.eq.${ref}`, `ozow_payout_id.eq.${ref}`]),
    ].filter(Boolean).join(",");
    if (!filters) {
      console.error("ozow-payout-notification missing reference:", JSON.stringify({ payloadKeys: Object.keys(payload) }));
      return jsonResponse({ error: "Missing payout reference" }, 400);
    }

    const { data: payout, error: payoutError } = await payoutQuery.or(filters).limit(1).maybeSingle();
    if (payoutError || !payout) {
      console.error("ozow-payout-notification payout not found:", JSON.stringify({ refs, payoutError: payoutError?.message ?? null }));
      // Store the event unattached so the payload survives for reconciliation.
      try {
        await supabase.from("payout_webhook_events").insert({
          vendor_payout_id: null,
          event_type: "notification_unmatched",
          ozow_status: refs.status,
          raw_payload: null,
          redacted_payload: redactValue(payload),
          headers_redacted: redactHeaders(req.headers),
        });
      } catch (_e) { /* ignore */ }
      return jsonResponse({ error: "Payout not found" }, 404);
    }


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

    // Fire payout_released SMS ONLY on normalized "paid" — never on submitted/pending/failed/rejected.
    if (normalizedStatus === "paid") {
      try {
        const { fireNotifyVendorEvent } = await import("../_shared/notifyVendorEvent.ts");
        fireNotifyVendorEvent({ event_type: "payout_released", vendor_payout_id: payout.id });
      } catch (_e) { /* ignore */ }
    }

    return jsonResponse({ success: true, status: normalizedStatus, vendor_payout_id: payout.id });
  } catch (err) {
    console.error("ozow-payout-notification error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});