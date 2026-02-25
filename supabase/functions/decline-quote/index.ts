import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { quote_id } = await req.json();
    if (!quote_id) {
      return new Response(JSON.stringify({ error: "quote_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log("decline-quote called by user:", user.id, "for quote:", quote_id);

    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("id, status, vendor_id, request_id")
      .eq("id", quote_id)
      .maybeSingle();

    if (quoteError || !quote) {
      console.error("Quote not found:", quote_id, quoteError);
      return new Response(JSON.stringify({ error: "Quote not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch the service request separately to validate ownership
    const { data: serviceReq, error: srError } = await supabase
      .from("service_requests")
      .select("id, requester_user_id")
      .eq("id", quote.request_id)
      .maybeSingle();

    console.log("Service request lookup:", { request_id: quote.request_id, serviceReq, srError, user_id: user.id });

    if (!serviceReq) {
      return new Response(JSON.stringify({ error: "Service request not found for this quote" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (serviceReq.requester_user_id !== user.id) {
      console.error("Ownership mismatch:", { requester: serviceReq.requester_user_id, caller: user.id });
      return new Response(JSON.stringify({ error: `Only the client can decline this quote. You are ${user.id} but the requester is ${serviceReq.requester_user_id}` }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (quote.status !== "pending_client") {
      return new Response(JSON.stringify({ error: "Quote is no longer pending" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabase.from("quotes").update({ status: "client_declined" }).eq("id", quote_id);
    await supabase.from("service_requests").update({ status: "declined" }).eq("id", quote.request_id);

    // Post system message
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", user.id)
      .eq("vendor_id", quote.vendor_id)
      .order("last_message_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (conv) {
      await supabase.from("messages").insert({
        conversation_id: conv.id,
        sender_type: "system",
        sender_user_id: user.id,
        message_type: "system",
        content: "❌ Quote declined.",
        metadata: { quote_id },
      });
      await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conv.id);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
