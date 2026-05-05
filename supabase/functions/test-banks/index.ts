Deno.serve(async () => {
  const apiKey = Deno.env.get("OZOW_PAYOUT_API_KEY")!;
  const siteCode = Deno.env.get("OZOW_SITE_CODE")!;
  const res = await fetch("https://stagingpayoutsapi.ozow.com/v1/getavailablebanks", {
    method: "GET",
    headers: {
      SiteCode: siteCode,
      ApiKey: apiKey,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  const body = await res.text();
  return new Response(JSON.stringify({ status: res.status, body }), {
    headers: { "Content-Type": "application/json" },
  });
});
