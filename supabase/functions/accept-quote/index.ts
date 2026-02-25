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

    // Fetch quote with request
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("*, request:service_requests(id, requester_user_id, event_id, event_date)")
      .eq("id", quote_id)
      .single();

    if (quoteError || !quote) {
      return new Response(JSON.stringify({ error: "Quote not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Validate requester
    if (quote.request.requester_user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Only the client can accept this quote" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (quote.status !== "pending_client") {
      return new Response(JSON.stringify({ error: "Quote is no longer pending" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check expiry
    if (quote.expires_at && new Date(quote.expires_at) < new Date()) {
      await supabase.from("quotes").update({ status: "expired" }).eq("id", quote_id);
      return new Response(JSON.stringify({ error: "Quote has expired" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update quote status
    await supabase.from("quotes").update({ status: "client_accepted" }).eq("id", quote_id);

    // Update service_request status
    await supabase.from("service_requests").update({ status: "accepted" }).eq("id", quote.request_id);

    // Decline other quotes for same request
    await supabase.from("quotes").update({ status: "client_declined" }).eq("request_id", quote.request_id).neq("id", quote_id).eq("status", "pending_client");

    // Create booking
    const depositPercentage = quote.deposit_percentage || 50;
    const depositAmount = quote.price * (depositPercentage / 100);
    const balanceAmount = quote.price - depositAmount;

    // Get event date for booking
    let eventDateTime = null;
    if (quote.request.event_id) {
      const { data: event } = await supabase.from("events").select("date").eq("id", quote.request.event_id).single();
      if (event?.date) {
        eventDateTime = new Date(event.date + "T12:00:00").toISOString();
      }
    }

    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .insert({
        event_id: quote.request.event_id,
        client_id: user.id,
        vendor_id: quote.vendor_id,
        quote_id: quote_id,
        service_category: null,
        agreed_price: quote.price,
        deposit_amount: depositAmount,
        balance_amount: balanceAmount,
        booking_status: "pending_deposit",
        deposit_status: "due",
        balance_status: "not_due",
        event_date_time: eventDateTime,
      })
      .select("id")
      .single();

    if (bookingErr) {
      console.error("Error creating booking:", bookingErr);
      return new Response(JSON.stringify({ error: "Failed to create booking" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Post system message to conversation
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
        content: "✅ Quote accepted! Please pay the deposit to confirm the booking.",
        metadata: { quote_id, booking_id: booking.id },
      });
      await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conv.id);
    }

    return new Response(
      JSON.stringify({ booking_id: booking.id, quote_status: "client_accepted" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
