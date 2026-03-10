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

    console.log("accept-quote called by user:", user.id, "for quote:", quote_id);

    // Fetch quote
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("id, status, vendor_id, request_id, price, deposit_percentage, expires_at")
      .eq("id", quote_id)
      .maybeSingle();

    if (quoteError || !quote) {
      console.error("Quote not found:", quote_id, quoteError);
      return new Response(JSON.stringify({ error: "Quote not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch the service request separately
    const { data: serviceReq, error: srError } = await supabase
      .from("service_requests")
      .select("id, requester_user_id, event_id, event_date")
      .eq("id", quote.request_id)
      .maybeSingle();

    console.log("Service request lookup:", { request_id: quote.request_id, serviceReq, srError, user_id: user.id });

    if (!serviceReq) {
      return new Response(JSON.stringify({ error: "Service request not found for this quote" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (serviceReq.requester_user_id !== user.id) {
      console.error("Ownership mismatch:", { requester: serviceReq.requester_user_id, caller: user.id });
      return new Response(JSON.stringify({ error: "Only the original requester can perform this action." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

    // Create booking — amounts include the 8% platform service fee
    const depositPercentage = quote.deposit_percentage || 50;
    const platformFee = Math.round(quote.price * 0.08 * 100) / 100;
    const totalWithFee = quote.price + platformFee;
    const depositAmount = Math.round(totalWithFee * (depositPercentage / 100) * 100) / 100;
    const balanceAmount = Math.round((totalWithFee - depositAmount) * 100) / 100;

    // Get event date for booking
    let eventDateTime = null;
    if (serviceReq.event_id) {
      const { data: event } = await supabase.from("events").select("date").eq("id", serviceReq.event_id).single();
      if (event?.date) {
        eventDateTime = new Date(event.date + "T12:00:00").toISOString();
      }
    }

    // Generate order number
    const { data: orderNumResult } = await supabase.rpc("generate_order_number" as any);
    const orderNumber = (orderNumResult as unknown as string) || `UMC-O-${Date.now()}`;

    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .insert({
        event_id: serviceReq.event_id,
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
        order_number: orderNumber,
      })
      .select("id")
      .single();

    if (bookingErr) {
      console.error("Error creating booking:", bookingErr);
      return new Response(JSON.stringify({ error: "Failed to create booking" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Generate Order Confirmation PDF (fire-and-forget)
    try {
      await fetch(`${supabaseUrl}/functions/v1/generate-order-confirmation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ booking_id: booking.id, order_number: orderNumber }),
      });
    } catch (e) {
      console.error("Order PDF generation failed (non-blocking):", e);
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
        content: `✅ Quote accepted! Order ${orderNumber} created. Please pay the deposit to confirm.`,
        metadata: { quote_id, booking_id: booking.id, order_number: orderNumber, visibility: "client" },
      });
      await supabase.from("messages").insert({
        conversation_id: conv.id,
        sender_type: "system",
        sender_user_id: user.id,
        message_type: "system",
        content: `✅ Quote accepted! Order ${orderNumber} created. Awaiting deposit payment.`,
        metadata: { quote_id, booking_id: booking.id, order_number: orderNumber, visibility: "vendor" },
      });
      await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conv.id);
    }

    return new Response(
      JSON.stringify({ booking_id: booking.id, quote_status: "client_accepted", order_number: orderNumber }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
