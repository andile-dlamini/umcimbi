const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = (Deno.env.get("SUPABASE_URL") ?? "").trim();
  const accessToken = (Deno.env.get("OZOW_PAYOUT_ACCESS_TOKEN") ?? "").trim();

  const body = {
    PayoutId: "20260428-304c-45df-94ac-416373b3b456",
    SiteCode: "ISI-UMC-001",
    Amount: 10.0,
    MerchantReference: "UMC-O-TEST-001",
    CustomerBankReference: "UMC-2b5849ae-2250-4a",
    IsRtc: false,
    NotifyUrl: "https://pnnckeqrzjglcwkyzzxg.supabase.co/functions/v1/ozow-payout-notification",
    bankingDetails: {
      bankGroupId: "913999fa-3a32-4e3d-82f0-a1df7e9e4f7b",
      accountNumber: "test",
      branchCode: "470010",
    },
    HashCheck: "test",
  };

  const target = `${supabaseUrl}/functions/v1/ozow-payout-verification`;
  const res = await fetch(target, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "AccessToken": accessToken,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  return new Response(
    JSON.stringify({
      target,
      tokenPresent: accessToken.length > 0,
      tokenLength: accessToken.length,
      status: res.status,
      body: text,
    }, null, 2),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
