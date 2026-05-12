const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sha512Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-512", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const b = await req.json();
  const SiteCode = b.SiteCode || Deno.env.get("OZOW_SITE_CODE") || "";
  const key = Deno.env.get("OZOW_PRIVATE_KEY") || "";
  const fields = [
    SiteCode,
    b.TransactionId || "",
    b.TransactionReference || "",
    b.Amount || "",
    b.Status || "",
    b.Optional1 || "",
    b.Optional2 || "",
    b.Optional3 || "",
    b.Optional4 || "",
    b.Optional5 || "",
    b.CurrencyCode || "",
    b.IsTest || "",
    b.StatusMessage || "",
  ];
  const input = (fields.join("") + key).toLowerCase();
  const hash = await sha512Hex(input);
  return new Response(JSON.stringify({ SiteCode, fields, hash }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
