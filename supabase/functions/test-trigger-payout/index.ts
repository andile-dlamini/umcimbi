const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    let booking_id = "824a1cb4-970a-4069-a2c9-89b04e429dce";
    try {
      const body = await req.json();
      if (body?.booking_id) booking_id = body.booking_id;
    } catch (_) { /* ignore */ }

    const upstream = await fetch(`${supabaseUrl}/functions/v1/trigger-vendor-payout`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ booking_id }),
    });

    const text = await upstream.text();

    return new Response(
      JSON.stringify({ status: upstream.status, body: text, booking_id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
