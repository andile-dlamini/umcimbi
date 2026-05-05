Deno.serve(async () => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(`${url}/functions/v1/trigger-vendor-payout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ booking_id: "824a1cb4-970a-4069-a2c9-89b04e429dce" }),
  });
  return new Response(JSON.stringify({ status: res.status, body: await res.text() }), {
    headers: { "Content-Type": "application/json" },
  });
});
