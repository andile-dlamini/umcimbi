const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const apiKey = (Deno.env.get("OZOW_PAYOUT_API_KEY") ?? "").trim();
  const siteCode = (Deno.env.get("OZOW_SITE_CODE") ?? "").trim();
  const url = "https://stagingpayoutsapi.ozow.com/mock/v1/settestconfiguration?siteCode=ISI-UMC-001";
  const body = {
    siteCode: "ISI-UMC-001",
    isAccountDecryptionFailed: true,
    isNullResponse: false,
    isInvalidStatusCode: false,
    isPayoutMismatch: false,
    isNotVerifiedResponse: false,
    isAccountNumberDecryptionKeyMissing: false,
    hasRetriedCountBeenExceeded: false,
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { SiteCode: siteCode, ApiKey: apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: unknown = text;
  try { parsed = JSON.parse(text); } catch {}
  return new Response(JSON.stringify({ status: res.status, body: parsed }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
