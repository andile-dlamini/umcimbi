Deno.serve(async () => {
  const apiKey = Deno.env.get("OZOW_PAYOUT_API_KEY")!;
  const siteCode = Deno.env.get("OZOW_SITE_CODE")!;
  const res = await fetch(
    "https://stagingpayoutsapi.ozow.com/v1/getpayout?payoutId=20260505-517a-4668-9305-d90d8a15c45a",
    {
      method: "GET",
      headers: { SiteCode: siteCode, ApiKey: apiKey },
    },
  );
  const text = await res.text();
  return new Response(JSON.stringify({ status: res.status, body: text }), {
    headers: { "Content-Type": "application/json" },
  });
});
