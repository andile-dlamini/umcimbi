import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const bookingId = "824a1cb4-970a-4069-a2c9-89b04e429dce";

    const { data: updated, error: updErr } = await supabase
      .from("vendor_payouts")
      .update({ status: "failed" })
      .eq("booking_id", bookingId)
      .select("id, status, internal_reference, ozow_payout_id, created_at");

    if (updErr) {
      return new Response(JSON.stringify({ step: "update", error: updErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ttpRes = await fetch(`${supabaseUrl}/functions/v1/test-trigger-payout`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        "apikey": serviceKey,
      },
      body: JSON.stringify({ booking_id: bookingId }),
    });
    const ttpStatus = ttpRes.status;
    const ttpText = await ttpRes.text();
    let ttpBody: unknown = ttpText;
    try { ttpBody = JSON.parse(ttpText); } catch { /* keep text */ }

    return new Response(JSON.stringify({
      updated_rows: updated,
      test_trigger_payout: { status_code: ttpStatus, body: ttpBody },
    }, null, 2), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
