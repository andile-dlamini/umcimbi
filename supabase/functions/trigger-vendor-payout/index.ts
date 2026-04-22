import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REQUIRED_BANK_FIELDS = [
  "bank_name",
  "bank_account_holder_name",
  "bank_account_number",
  "bank_account_type",
  "bank_branch_code",
] as const;

const SENSITIVE_KEYS = ["accountnumber", "account_number", "branchcode", "branch_code", "bankaccountnumber", "bankbranchcode", "bankdetails", "authorization", "accesstoken"];

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

function normalizeInitialStatus(response: Record<string, unknown>, ok: boolean) {
  const status = String(response.status ?? response.Status ?? response.payoutStatus ?? response.PayoutStatus ?? "").toLowerCase();
  if (!ok) return status.includes("reject") ? "rejected" : "failed";
  if (["rejected", "declined", "failed", "error"].some((value) => status.includes(value))) return status.includes("reject") || status.includes("declin") ? "rejected" : "failed";
  return "submitted";
}

function extractResponseRef(response: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = response[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    if (authHeader !== `Bearer ${serviceKey}`) return jsonResponse({ error: "Unauthorized" }, 401);

    const payoutAccessToken = (Deno.env.get("OZOW_PAYOUT_ACCESS_TOKEN") ?? "").trim();
    const payoutApiUrl = (Deno.env.get("OZOW_PAYOUT_API_URL") ?? "").trim();
    if (!payoutAccessToken || !payoutApiUrl) return jsonResponse({ error: "Payout service not configured" }, 500);

    const { booking_id } = await req.json();
    if (!booking_id) return jsonResponse({ error: "booking_id is required" }, 400);

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, vendor_id, agreed_price, booking_status, funds_released_at, order_number")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) return jsonResponse({ error: "Booking not found" }, 404);
    if (booking.booking_status !== "completed" || !booking.funds_released_at) {
      return jsonResponse({ error: "Booking is not eligible for payout" }, 400);
    }

    const { data: duplicate } = await supabase
      .from("vendor_payouts")
      .select("id, status")
      .eq("booking_id", booking_id)
      .in("status", ["pending", "submitted", "paid"])
      .limit(1)
      .maybeSingle();

    if (duplicate) return jsonResponse({ error: "Payout already exists for this booking", vendor_payout_id: duplicate.id, status: duplicate.status }, 409);

    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, name, bank_name, bank_account_holder_name, bank_account_number, bank_account_type, bank_branch_code")
      .eq("id", booking.vendor_id)
      .single();

    if (vendorError || !vendor) return jsonResponse({ error: "Vendor not found" }, 404);

    const missingFields = REQUIRED_BANK_FIELDS.filter((field) => !String(vendor[field] ?? "").trim());
    if (missingFields.length > 0) return jsonResponse({ error: "Vendor payout details incomplete", missing_fields: missingFields }, 400);

    const amount = Number(booking.agreed_price);
    if (!Number.isFinite(amount) || amount <= 0) return jsonResponse({ error: "Invalid payout amount" }, 400);

    const internalReference = `UMC-P-${Date.now()}-${booking.id.replace(/-/g, "").slice(0, 8)}`;
    const payoutPayload = {
      InternalReference: internalReference,
      MerchantReference: booking.order_number ?? booking.id,
      Amount: amount.toFixed(2),
      CurrencyCode: "ZAR",
      BankName: vendor.bank_name,
      AccountHolderName: vendor.bank_account_holder_name,
      AccountNumber: vendor.bank_account_number,
      AccountType: vendor.bank_account_type,
      BranchCode: vendor.bank_branch_code,
      RecipientName: vendor.name,
    };

    const { data: payout, error: insertError } = await supabase
      .from("vendor_payouts")
      .insert({
        booking_id: booking.id,
        vendor_id: booking.vendor_id,
        amount,
        currency: "ZAR",
        internal_reference: internalReference,
        status: "pending",
        request_payload: redactValue(payoutPayload),
      })
      .select("id")
      .single();

    if (insertError || !payout) return jsonResponse({ error: "Failed to create payout record" }, 500);

    let responsePayload: Record<string, unknown> = {};
    let responseOk = false;
    let responseStatus = 0;

    try {
      const ozowRes = await fetch(payoutApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "AccessToken": payoutAccessToken,
          "x-access-token": payoutAccessToken,
        },
        body: JSON.stringify(payoutPayload),
      });
      responseOk = ozowRes.ok;
      responseStatus = ozowRes.status;
      const text = await ozowRes.text();
      responsePayload = text ? JSON.parse(text) : {};
    } catch (err) {
      responsePayload = { error: err instanceof Error ? err.message : "Ozow payout request failed" };
    }

    const initialStatus = normalizeInitialStatus(responsePayload, responseOk);
    const failureReason = initialStatus === "failed" || initialStatus === "rejected"
      ? String(responsePayload.errorMessage ?? responsePayload.ErrorMessage ?? responsePayload.message ?? responsePayload.Message ?? `Ozow response status ${responseStatus || "unavailable"}`)
      : null;

    await supabase
      .from("vendor_payouts")
      .update({
        status: initialStatus,
        ozow_payout_id: extractResponseRef(responsePayload, ["payoutId", "PayoutId", "ozowPayoutId", "OzowPayoutId"]),
        ozow_reference: extractResponseRef(responsePayload, ["reference", "Reference", "ozowReference", "OzowReference"]),
        response_payload: redactValue(responsePayload),
        submitted_at: initialStatus === "submitted" ? new Date().toISOString() : null,
        failed_at: failureReason ? new Date().toISOString() : null,
        failure_reason: failureReason,
      })
      .eq("id", payout.id);

    if (failureReason) return jsonResponse({ success: false, vendor_payout_id: payout.id, status: initialStatus, error: failureReason }, 502);
    return jsonResponse({ success: true, vendor_payout_id: payout.id, status: initialStatus });
  } catch (err) {
    console.error("trigger-vendor-payout error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
