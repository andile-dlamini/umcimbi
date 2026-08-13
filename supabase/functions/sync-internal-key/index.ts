// sync-internal-key: copies the runtime SUPABASE_SERVICE_ROLE_KEY into the
// vault secret `email_queue_service_role_key` used by cron jobs and DB triggers.
// The key value never leaves the function.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function fp(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).slice(0, 4).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function roleClaim(token: string): string | null {
  try {
    const p = token.split(".")[1];
    return JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")))?.role ?? null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token || (token !== SERVICE_ROLE && roleClaim(token) !== "service_role")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }


  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { error } = await sb.rpc("vault_update_email_queue_key", { new_secret: SERVICE_ROLE });

  if (error) {
    console.error("vault update failed:", error.message);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("vault secret email_queue_service_role_key synced");
  return new Response(JSON.stringify({ ok: true, env_fp: await fp(SERVICE_ROLE), caller_fp: await fp(token) }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

});
