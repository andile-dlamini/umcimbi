Deno.serve(() => {
  return new Response(JSON.stringify({
    OZOW_PAYOUT_API_URL: Deno.env.get("OZOW_PAYOUT_API_URL"),
  }), { headers: { "Content-Type": "application/json" } });
});
