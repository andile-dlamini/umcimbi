const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE = "https://stagingpayoutsapi.ozow.com/mock/v1";
const SITE_CODE_LITERAL = "ISI-UMC-001";
const SCENARIOS = ["isAccountDecryptionFailed", "isNotVerifiedResponse", "isAccountNumberDecryptionKeyMissing"] as const;

async function doStep(url: string, init: RequestInit) {
  try {
    const res = await fetch(url, init);
    const text = await res.text();
    let body: unknown = text;
    try { body = text ? JSON.parse(text) : null; } catch { /* keep text */ }
    return { status: res.status, body };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function buildEncryptedAccountAndHash(opts: {
  siteCode: string;
  amount: number;
  merchantReference: string;
  customerBankReference: string;
  isRtc: boolean;
  notifyUrl: string;
  bankGroupId: string;
  branchCode: string;
  accountNumber: string;
  apiKey: string;
}) {
  const amountInCents = Math.round(opts.amount * 100);
  const rawKey = crypto.randomUUID().replace(/-/g, "").substring(0, 20);
  let encryptionKey = rawKey;
  while (encryptionKey.length < 32) encryptionKey += rawKey;
  encryptionKey = encryptionKey.substring(0, 32);

  const ivInput = `${opts.merchantReference}${amountInCents}${rawKey}`.toLowerCase();
  const ivHashBuffer = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(ivInput));
  const ivHex = bytesToHex(new Uint8Array(ivHashBuffer));
  const iv = ivHex.substring(0, 16);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(encryptionKey),
    { name: "AES-CBC" },
    false,
    ["encrypt"],
  );
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv: new TextEncoder().encode(iv) },
    cryptoKey,
    new TextEncoder().encode(opts.accountNumber),
  );
  const encryptedAccountNumber = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));

  const hashInput = [
    opts.siteCode,
    amountInCents,
    opts.merchantReference,
    opts.customerBankReference,
    opts.isRtc,
    opts.notifyUrl,
    opts.bankGroupId,
    encryptedAccountNumber,
    opts.branchCode,
    opts.apiKey,
  ].join("").toLowerCase();
  const hashBuffer = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(hashInput));
  const hashCheck = bytesToHex(new Uint8Array(hashBuffer));

  return { encryptedAccountNumber, hashCheck };
}

function extractPayoutId(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const direct = b.payoutId ?? b.PayoutId;
  if (direct) return String(direct);
  const ps = (b.payoutStatus ?? b.PayoutStatus) as Record<string, unknown> | undefined;
  if (ps && typeof ps === "object") {
    const nested = ps.payoutId ?? ps.PayoutId;
    if (nested) return String(nested);
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const apiKey = (Deno.env.get("OZOW_PAYOUT_API_KEY") ?? "").trim();
    const siteCodeSecret = (Deno.env.get("OZOW_SITE_CODE") ?? "").trim();
    if (!apiKey || !siteCodeSecret) {
      return new Response(JSON.stringify({ error: "Missing OZOW secrets" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let scenario = "";
    try {
      const body = await req.json();
      scenario = String(body?.scenario ?? "");
    } catch { /* ignore */ }

    if (!SCENARIOS.includes(scenario as typeof SCENARIOS[number])) {
      return new Response(JSON.stringify({ error: "Invalid scenario", allowed: SCENARIOS }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authedHeaders = { SiteCode: SITE_CODE_LITERAL, ApiKey: apiKey };
    const authedJsonHeaders = { ...authedHeaders, "Content-Type": "application/json" };

    // Step 1
    const step1 = await doStep(`${BASE}/gettestconfiguration?siteCode=${SITE_CODE_LITERAL}`, {
      method: "GET", headers: authedHeaders,
    });

    // Step 2
    const setBody: Record<string, unknown> = { siteCode: SITE_CODE_LITERAL };
    for (const s of SCENARIOS) setBody[s] = (s === scenario);
    const step2 = await doStep(`${BASE}/settestconfiguration`, {
      method: "POST", headers: authedJsonHeaders, body: JSON.stringify(setBody),
    });

    // Step 3
    const step3 = await doStep(`${BASE}/gettestconfiguration?siteCode=${SITE_CODE_LITERAL}`, {
      method: "GET", headers: authedHeaders,
    });

    // Step 4
    const payoutBody = {
      SiteCode: SITE_CODE_LITERAL,
      Amount: 1.00,
      MerchantReference: `UMC-M-${Date.now().toString().slice(-8)}`,
      CustomerBankReference: "UMC-MOCK-REF-001",
      IsRtc: false,
      NotifyUrl: "https://pnnckeqrzjglcwkyzzxg.supabase.co/functions/v1/ozow-payout-notification",
      bankingDetails: {
        bankGroupId: "3284a0ad-ba78-4838-8c2b-102981286a2b",
        accountNumber: "dummyEncrypted==",
        branchCode: "632005",
      },
      HashCheck: "dummyhash",
    };
    const step4 = await doStep(`${BASE}/requestpayout`, {
      method: "POST", headers: authedJsonHeaders, body: JSON.stringify(payoutBody),
    });

    // Step 5
    const payoutId = extractPayoutId((step4 as { body?: unknown }).body);
    let step5: unknown;
    if (!payoutId) {
      step5 = { skipped: true, reason: "no payoutId in step4" };
    } else {
      step5 = await doStep(`${BASE}/getpayout?payoutId=${encodeURIComponent(payoutId)}`, {
        method: "GET", headers: { SiteCode: SITE_CODE_LITERAL, ApiKey: apiKey },
      });
    }

    // Step 6
    const resetBody: Record<string, unknown> = { siteCode: SITE_CODE_LITERAL };
    for (const s of SCENARIOS) resetBody[s] = false;
    const step6 = await doStep(`${BASE}/settestconfiguration`, {
      method: "POST", headers: authedJsonHeaders, body: JSON.stringify(resetBody),
    });

    return new Response(
      JSON.stringify({ scenario, payoutId, step1, step2, step3, step4, step5, step6 }, null, 2),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
