// One-shot admin utility: writes the runtime SUPABASE_SERVICE_ROLE_KEY into
// vault.secrets under the name expected by DB triggers (email_queue_service_role_key).
// Auth: caller must present the same service-role key as Bearer.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (token !== SERVICE_ROLE) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
  // Look up existing secret by name via SQL RPC-style call using a temp function is overkill;
  // instead try update; if 0 rows, insert.
  const { data: existing, error: selErr } = await sb
    .schema("vault" as any)
    .from("secrets")
    .select("id")
    .eq("name", "email_queue_service_role_key")
    .maybeSingle();

  if (selErr) {
    return new Response(JSON.stringify({ error: "select_failed", detail: selErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (existing?.id) {
    // Use the vault.update_secret function via rpc
    const { error } = await sb.rpc("vault_update_email_queue_key" as any, { new_secret: SERVICE_ROLE });
    if (error) {
      return new Response(JSON.stringify({ error: "update_failed", detail: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, action: "updated" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error } = await sb.rpc("vault_create_email_queue_key" as any, { new_secret: SERVICE_ROLE });
  if (error) {
    return new Response(JSON.stringify({ error: "create_failed", detail: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ ok: true, action: "created" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
