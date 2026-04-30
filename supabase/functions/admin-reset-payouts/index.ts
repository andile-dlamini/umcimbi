import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { booking_id } = await req.json();
  const { data, error } = await supabase
    .from("vendor_payouts")
    .update({ status: "failed" })
    .eq("booking_id", booking_id)
    .select("id, status");
  return new Response(JSON.stringify({ data, error }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
