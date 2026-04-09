import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticate user via Bearer token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { booking_id, photo_url, notes } = await req.json();

    if (!booking_id || !photo_url) {
      return new Response(JSON.stringify({ error: "booking_id and photo_url are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, client_id, vendor_id, balance_amount")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is the vendor for this booking
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id, name")
      .eq("id", booking.vendor_id)
      .eq("owner_user_id", user.id)
      .single();

    if (!vendor) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert delivery proof
    const { error: insertError } = await supabase.from("delivery_proofs").insert({
      booking_id,
      uploaded_by: user.id,
      photos: [photo_url],
      notes: notes || null,
    });

    if (insertError) {
      console.error("Failed to insert delivery proof:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save proof" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find conversation
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", booking.client_id)
      .eq("vendor_id", booking.vendor_id)
      .order("last_message_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (conv) {
      // Message for client
      await supabase.from("messages").insert({
        conversation_id: conv.id,
        sender_type: "system",
        sender_user_id: null,
        message_type: "system",
        content: `📸 ${vendor.name} has uploaded proof of service delivery. Please confirm receipt in your booking, or funds will be released automatically within 48 hours.`,
      });

      // Message for vendor
      await supabase.from("messages").insert({
        conversation_id: conv.id,
        sender_type: "system",
        sender_user_id: null,
        message_type: "system",
        content: `✅ Your proof of delivery has been submitted. Payment of R${booking.balance_amount?.toLocaleString()} will be released within 48 hours unless the client raises a dispute.`,
      });

      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conv.id);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("upload-delivery-proof error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
