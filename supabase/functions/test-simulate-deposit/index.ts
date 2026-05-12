Deno.serve(async (_req) => {
  const payoutRes = await fetch(Deno.env.get("SUPABASE_URL")! + "/functions/v1/trigger-vendor-payout", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      booking_id: "0c1a21a6-2cae-40fe-8840-175a8a6afef6",
      payout_type: "deposit",
      override_amount: 50,
    }),
  });
  const payoutText = await payoutRes.text();
  return new Response(JSON.stringify({ status: payoutRes.status, body: payoutText }), {
    headers: { "Content-Type": "application/json" },
  });
});
