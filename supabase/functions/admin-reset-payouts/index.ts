import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);
  const { booking_id } = await req.json();

  const { data: updated, error } = await supabase
    .from("vendor_payouts")
    .update({ status: "failed" })
    .eq("booking_id", booking_id)
    .select("id, status");

  const triggerRes = await fetch(`${supabaseUrl}/functions/v1/test-trigger-payout`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ booking_id }),
  });
  const triggerText = await triggerRes.text();
  let triggerBody: unknown = triggerText;
  try { triggerBody = JSON.parse(triggerText); } catch { /* keep text */ }

  return new Response(
    JSON.stringify({
      reset: { updated, error },
      trigger: { status: triggerRes.status, body: triggerBody },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
