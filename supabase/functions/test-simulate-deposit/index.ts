Deno.serve(async (_req) => {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  console.log("URL set:", !!url, "KEY set:", !!key, "KEY len:", key?.length ?? 0);

  const payoutRes = await fetch(url + "/functions/v1/trigger-vendor-payout", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      booking_id: "0c1a21a6-2cae-40fe-8840-175a8a6afef6",
      payout_type: "deposit",
      override_amount: 50,
    }),
  });
  const payoutText = await payoutRes.text();
  return new Response(JSON.stringify({ status: payoutRes.status, body: payoutText, keyLen: key?.length ?? 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
