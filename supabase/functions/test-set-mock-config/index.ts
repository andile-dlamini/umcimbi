Deno.serve(async () => {
  const apiKey = Deno.env.get("OZOW_PAYOUT_API_KEY")!;
  const siteCode = Deno.env.get("OZOW_SITE_CODE")!;
  const res = await fetch(
    "https://stagingpayoutsapi.ozow.com/mock/v1/settestconfiguration?siteCode=ISI-UMC-001",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        SiteCode: siteCode,
        ApiKey: apiKey,
      },
      body: JSON.stringify({
        siteCode: "ISI-UMC-001",
        isAccountDecryptionFailed: false,
        isNullResponse: false,
        isInvalidStatusCode: false,
        isPayoutMismatch: false,
        isNotVerifiedResponse: false,
        isAccountNumberDecryptionKeyMissing: true,
        hasRetriedCountBeenExceeded: false,
      }),
    },
  );
  const text = await res.text();
  return new Response(JSON.stringify({ status: res.status, body: text }), {
    headers: { "Content-Type": "application/json" },
  });
});
