const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE = "https://stagingpayoutsapi.ozow.com/mock/v1";

// Initial pending sub-status returned by mock immediately after RequestPayout.
// We poll until subStatus moves off 201, or maxAttempts reached.
const PENDING_SUB_STATUS = 201;
const DEFAULT_MAX_ATTEMPTS = 10;
const DEFAULT_INTERVAL_MS = 1500;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchPayout(id: string, headers: Record<string, string>) {
  const res = await fetch(`${BASE}/getpayout?payoutId=${encodeURIComponent(id)}`, {
    method: "GET", headers,
  });
  const text = await res.text();
  let body: unknown = text;
  try { body = text ? JSON.parse(text) : null; } catch { /* keep text */ }
  return { status: res.status, body };
}

function extractSubStatus(body: unknown): number | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const ps = (b.payoutStatus ?? b.PayoutStatus) as Record<string, unknown> | undefined;
  if (ps && typeof ps === "object") {
    const ss = ps.subStatus ?? ps.SubStatus;
    if (typeof ss === "number") return ss;
    if (typeof ss === "string" && ss.trim() !== "") {
      const n = Number(ss);
      if (!Number.isNaN(n)) return n;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = (Deno.env.get("OZOW_PAYOUT_API_KEY") ?? "").trim();
    const siteCode = (Deno.env.get("OZOW_SITE_CODE") ?? "").trim();
    if (!apiKey || !siteCode) {
      return new Response(JSON.stringify({ error: "Missing OZOW secrets" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let payoutIds: string[] = [];
    let maxAttempts = DEFAULT_MAX_ATTEMPTS;
    let intervalMs = DEFAULT_INTERVAL_MS;
    try {
      const body = await req.json();
      if (Array.isArray(body?.payoutIds)) payoutIds = body.payoutIds.map(String);
      if (typeof body?.maxAttempts === "number" && body.maxAttempts > 0) {
        maxAttempts = Math.min(30, Math.floor(body.maxAttempts));
      }
      if (typeof body?.intervalMs === "number" && body.intervalMs >= 250) {
        intervalMs = Math.min(5000, Math.floor(body.intervalMs));
      }
    } catch { /* ignore */ }

    if (payoutIds.length === 0) {
      return new Response(JSON.stringify({ error: "payoutIds array required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headers = { SiteCode: siteCode, ApiKey: apiKey };

    // Poll all ids in parallel; each id polls until settled (subStatus != 201) or maxAttempts.
    const pollOne = async (id: string) => {
      const attempts: Array<{ attempt: number; status: number; subStatus: number | null }> = [];
      let last: { status: number; body: unknown } | { error: string } | null = null;
      let settled = false;
      for (let i = 1; i <= maxAttempts; i++) {
        try {
          const res = await fetchPayout(id, headers);
          last = res;
          const sub = extractSubStatus(res.body);
          attempts.push({ attempt: i, status: res.status, subStatus: sub });
          if (sub !== null && sub !== PENDING_SUB_STATUS) {
            settled = true;
            break;
          }
        } catch (err) {
          last = { error: err instanceof Error ? err.message : String(err) };
          attempts.push({ attempt: i, status: -1, subStatus: null });
        }
        if (i < maxAttempts) await sleep(intervalMs);
      }
      return { settled, attempts, final: last };
    };

    const entries = await Promise.all(payoutIds.map(async (id) => [id, await pollOne(id)] as const));
    const results: Record<string, unknown> = {};
    for (const [id, r] of entries) results[id] = r;

    return new Response(
      JSON.stringify({ maxAttempts, intervalMs, results }, null, 2),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
