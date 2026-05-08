import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-access-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SENSITIVE_KEYS = [
  "accesstoken",
  "access_token",
  "authorization",
  "accountnumber",
  "account_number",
  "branchcode",
  "branch_code",
  "bankaccountnumber",
  "bankbranchcode",
  "bankdetails",
  "encryptionkey",
  "encryption_key",
  "decryptionkey",
];

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
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        isSensitiveKey(key) ? "[REDACTED]" : redactValue(nested),
      ])
    );
  }
  return value;
}

function redactHeaders(headers: Headers) {
  return Object.fromEntries(
    [...headers.entries()].map(([key, value]) => [key, isSensitiveKey(key) ? "[REDACTED]" : value])
  );
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
  return String(
    req.headers.get("x-access-token") ??
      req.headers.get("AccessToken") ??
      req.headers.get("accesstoken") ??
      payload.AccessToken ??
      payload.accessToken ??
      payload.access_token ??
      ""
  ).trim();
}

function pick(payload: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = payload[k];
    if (v !== undefined && v !== null && String(v).trim()) return String(v).trim();
  }
  return "";
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  console.log("[VERIFY] Request received:", req.method, "expect:", req.headers.get("expect") || "none");

  if (req.headers.get("expect")?.includes("100-continue")) {
    // Some HTTP clients send Expect: 100-continue before the body
    // We need to handle this gracefully
    console.log("[VERIFY] Expect header detected:", req.headers.get("expect"));
  }

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (!["GET", "POST"].includes(req.method)) return jsonResponse({ IsVerified: false, Reason: "Method not allowed" }, 405);

  try {
    const configuredToken = (Deno.env.get("OZOW_PAYOUT_ACCESS_TOKEN") ?? "").trim();
    const ozowSiteCode = (Deno.env.get("OZOW_SITE_CODE") ?? "").trim();
    const ozowPayoutApiKey = (Deno.env.get("OZOW_PAYOUT_API_KEY") ?? "").trim();

    if (!configuredToken || !ozowSiteCode || !ozowPayoutApiKey) {
      return jsonResponse({ IsVerified: false, Reason: "Verification unavailable" }, 500);
    }

    const payload = req.method === "GET" ? Object.fromEntries(new URL(req.url).searchParams) : await parsePayload(req);
    const token = getToken(req, payload);
    const tokenAuthorized = token.length > 0 && token === configuredToken;

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const payoutId = pick(payload, ["PayoutId", "payoutId", "payout_id"]);
    const merchantReference = pick(payload, ["MerchantReference", "merchantReference", "merchant_reference"]);
    const customerBankReference = pick(payload, ["CustomerBankReference", "customerBankReference", "customer_bank_reference"]);
    const rawAmount = pick(payload, ["AmountInCents", "amountInCents", "amount_in_cents", "Amount", "amount"]);
    const amountInCents = String(Math.round(parseFloat(rawAmount || "0") * 100));
    const isRtc = pick(payload, ["IsRtc", "isRtc", "is_rtc"]);
    const notifyUrl = pick(payload, ["NotifyUrl", "notifyUrl", "notify_url"]);
    const bankGroupId = pick(payload, ["BankGroupId", "bankGroupId", "bank_group_id"]);
    const accountNumber = pick(payload, ["AccountNumber", "accountNumber", "account_number"]);
    const branchCode = pick(payload, ["BranchCode", "branchCode", "branch_code"]);
    const incomingHash = pick(payload, ["HashCheck", "hashCheck", "hash_check"]);

    // Extract bankingDetails nested fields if present
    const bankingDetails = (payload.bankingDetails ?? payload.BankingDetails ?? {}) as Record<string, unknown>;
    const resolvedBankGroupId = bankGroupId || String(bankingDetails.bankGroupId ?? bankingDetails.BankGroupId ?? "");
    const resolvedAccountNumber = accountNumber || String(bankingDetails.accountNumber ?? bankingDetails.AccountNumber ?? "");
    const resolvedBranchCode = branchCode || String(bankingDetails.branchCode ?? bankingDetails.BranchCode ?? "");

    // Locate the payout by any reference we have
    let vendorPayout: { id: string; encryption_key: string | null } | null = null;
    const refCandidates = [payoutId, merchantReference, customerBankReference].filter(Boolean);
    if (refCandidates.length > 0) {
      const orClause = refCandidates
        .flatMap((ref) => [`internal_reference.eq.${ref}`, `ozow_reference.eq.${ref}`, `ozow_payout_id.eq.${ref}`])
        .join(",");
      const { data } = await supabase
        .from("vendor_payouts")
        .select("id, encryption_key")
        .or(orClause)
        .maybeSingle();
      if (data) vendorPayout = data as { id: string; encryption_key: string | null };
    }

    // Verify hash (PayoutId first per Ozow verification spec)
    let hashOk = false;
    if (incomingHash && payoutId) {
      const hashInput = [
        payoutId,
        ozowSiteCode,
        amountInCents,
        merchantReference,
        customerBankReference,
        isRtc,
        notifyUrl,
        resolvedBankGroupId,
        resolvedAccountNumber,
        resolvedBranchCode,
        ozowPayoutApiKey,
      ].join("").toLowerCase();
      const hashBuffer = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(hashInput));
      const computed = bytesToHex(new Uint8Array(hashBuffer));
      hashOk = computed === incomingHash.toLowerCase();
    }

    await supabase.from("payout_webhook_events").insert({
      vendor_payout_id: vendorPayout?.id ?? null,
      event_type: "verification",
      ozow_status: String(payload.Status ?? payload.status ?? "verification"),
      raw_payload: null,
      redacted_payload: redactValue(payload),
      headers_redacted: redactHeaders(req.headers),
    });

    if (!tokenAuthorized) {
      return jsonResponse({ PayoutId: payoutId, IsVerified: false, Reason: "Unauthorized" }, 401);
    }
    if (!vendorPayout || !vendorPayout.encryption_key) {
      return jsonResponse({ PayoutId: payoutId, IsVerified: false, Reason: "Payout not found" }, 404);
    }
    if (!hashOk) {
      return jsonResponse({ PayoutId: payoutId, IsVerified: false, Reason: "Hash mismatch" }, 200);
    }

    return jsonResponse({
      PayoutId: payoutId,
      IsVerified: true,
      AccountNumberDecryptionKey: vendorPayout.encryption_key,
      Reason: "",
    });
  } catch (err) {
    console.error("ozow-payout-verification error:", err);
    return jsonResponse({ IsVerified: false, Reason: "Internal server error" }, 500);
  }
});
