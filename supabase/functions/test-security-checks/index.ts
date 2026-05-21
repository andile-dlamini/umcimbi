const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  async function call(path: string, init: RequestInit) {
    try {
      const res = await fetch(`${url}/functions/v1/${path}`, init);
      await res.text();
      return res.status;
    } catch (e) {
      return `error: ${(e as Error).message}`;
    }
  }

  const test1 = await call("admin-daily-brief", { method: "POST" });
  const test2 = await call("admin-daily-brief", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
  });
  const test3 = await call("release-escrow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ booking_id: "test", mode: "client_confirmed" }),
  });
  const test4 = await call("release-escrow", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ booking_id: "00000000-0000-0000-0000-000000000000", mode: "client_confirmed" }),
  });

  return new Response(JSON.stringify({ test1, test2, test3, test4 }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
