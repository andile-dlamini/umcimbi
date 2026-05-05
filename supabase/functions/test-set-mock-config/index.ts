const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const apiKey = (Deno.env.get("OZOW_PAYOUT_API_KEY") ?? "").trim();
  const siteCode = (Deno.env.get("OZOW_SITE_CODE") ?? "").trim();
  const base = "https://stagingpayoutsapi.ozow.com/mock/v1";
  const headers = { SiteCode: siteCode, ApiKey: apiKey, "Content-Type": "application/json", Accept: "application/json" };

  const getRes = await fetch(`${base}/gettestconfiguration?siteCode=ISI-UMC-001`, { method: "GET", headers });
  const getBody = await getRes.text();

  const postBody = {
    siteCode: "ISI-UMC-001",
    isAccountDecryptionFailed: false,
    isNullResponse: false,
    isInvalidStatusCode: false,
    isPayoutMismatch: false,
    isNotVerifiedResponse: true,
    isAccountNumberDecryptionKeyMissing: false,
    hasRetriedCountBeenExceeded: false,
  };
  const postRes = await fetch(`${base}/settestconfiguration?siteCode=ISI-UMC-001`, {
    method: "POST",
    headers,
    body: JSON.stringify(postBody),
  });
  const postBodyText = await postRes.text();

  return new Response(
    JSON.stringify({
      get: { status: getRes.status, body: tryParse(getBody) },
      post: { status: postRes.status, body: tryParse(postBodyText) },
      siteCodeUsed: siteCode,
    }, null, 2),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

function tryParse(s: string) {
  try { return JSON.parse(s); } catch { return s; }
}
