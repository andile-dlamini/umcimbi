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
      payload.AccessToken ??
      payload.accessToken ??
      payload.access_token ??
      ""
  ).trim();
}

function getReference(payload: Record<string, unknown>) {
  return String(
    payload.InternalReference ??
      payload.internalReference ??
      payload.internal_reference ??
      payload.PayoutReference ??
      payload.payoutReference ??
      payload.Reference ??
      payload.reference ??
      ""
  ).trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (!["GET", "POST"].includes(req.method)) return jsonResponse({ allowed: false, error: "Method not allowed" }, 405);

  try {
    const configuredToken = (Deno.env.get("OZOW_PAYOUT_ACCESS_TOKEN") ?? "").trim();
    if (!configuredToken) return jsonResponse({ allowed: false, error: "Verification unavailable" }, 500);

    const payload = req.method === "GET" ? Object.fromEntries(new URL(req.url).searchParams) : await parsePayload(req);
    const token = getToken(req, payload);
    const authorized = token.length > 0 && token === configuredToken;

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const reference = getReference(payload);
    let vendorPayoutId: string | null = null;

    if (reference) {
      const { data } = await supabase
        .from("vendor_payouts")
        .select("id")
        .or(`internal_reference.eq.${reference},ozow_reference.eq.${reference},ozow_payout_id.eq.${reference}`)
        .maybeSingle();
      vendorPayoutId = data?.id ?? null;
    }

    await supabase.from("payout_webhook_events").insert({
      vendor_payout_id: vendorPayoutId,
      event_type: "verification",
      ozow_status: String(payload.Status ?? payload.status ?? "verification"),
      raw_payload: null,
      redacted_payload: redactValue(payload),
      headers_redacted: redactHeaders(req.headers),
    });

    if (!authorized) return jsonResponse({ allowed: false, error: "Unauthorized" }, 401);
    return jsonResponse({ allowed: true, verified: true, vendor_payout_id: vendorPayoutId });
  } catch (err) {
    console.error("ozow-payout-verification error:", err);
    return jsonResponse({ allowed: false, error: "Internal server error" }, 500);
  }
});