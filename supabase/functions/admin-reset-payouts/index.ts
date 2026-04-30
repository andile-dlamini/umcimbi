import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const bookingId = "824a1cb4-970a-4069-a2c9-89b04e429dce";

  const { data: updated, error: updateErr } = await supabase
    .from("vendor_payouts")
    .update({ status: "failed", failed_at: new Date().toISOString() })
    .eq("booking_id", bookingId)
    .select("id, status");

  if (updateErr) {
    return new Response(JSON.stringify({ step: "update", error: updateErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const triggerUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/test-trigger-payout`;
  const triggerRes = await fetch(triggerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify({ booking_id: bookingId }),
  });
  const triggerStatus = triggerRes.status;
  const triggerBody = await triggerRes.text();

  return new Response(
    JSON.stringify({ updated_rows: updated, trigger_status: triggerStatus, trigger_body: triggerBody }, null, 2),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
