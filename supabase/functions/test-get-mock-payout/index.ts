const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE = "https://stagingpayoutsapi.ozow.com/mock/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = (Deno.env.get("OZOW_PAYOUT_API_KEY") ?? "").trim();
    const siteCode = (Deno.env.get("OZOW_SITE_CODE") ?? "").trim();
    if (!apiKey || !siteCode) {
      return new Response(JSON.stringify({ error: "Missing OZOW secrets" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let payoutIds: string[] = [];
    try {
      const body = await req.json();
      if (Array.isArray(body?.payoutIds)) payoutIds = body.payoutIds.map(String);
    } catch { /* ignore */ }

    if (payoutIds.length === 0) {
      return new Response(JSON.stringify({ error: "payoutIds array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headers = { SiteCode: siteCode, ApiKey: apiKey };
    const results: Record<string, unknown> = {};

    for (const id of payoutIds) {
      try {
        const res = await fetch(`${BASE}/getpayout?payoutId=${encodeURIComponent(id)}`, {
          method: "GET",
          headers,
        });
        const text = await res.text();
        let body: unknown = text;
        try { body = text ? JSON.parse(text) : null; } catch { /* keep text */ }
        results[id] = { status: res.status, body };
      } catch (err) {
        results[id] = { error: err instanceof Error ? err.message : String(err) };
      }
    }

    return new Response(JSON.stringify(results, null, 2), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
