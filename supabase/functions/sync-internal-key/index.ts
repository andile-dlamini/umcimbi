import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async () => {
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data, error } = await sb.rpc("sync_email_queue_service_key", { _key: SERVICE_ROLE });
  return new Response(JSON.stringify({ ok: !error, data, error: error?.message }), {
    headers: { "Content-Type": "application/json" },
  });
});
