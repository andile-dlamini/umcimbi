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

    const { booking_id } = await req.json();

    if (!booking_id) {
      return new Response(JSON.stringify({ error: "booking_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, client_id, vendor_id, balance_amount, booking_status")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is client or vendor
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("id", booking.vendor_id)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    const isClient = booking.client_id === user.id;
    const isVendor = !!vendor;

    if (!isClient && !isVendor) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (booking.booking_status !== "confirmed") {
      return new Response(JSON.stringify({ error: "Cannot dispute a booking that is not confirmed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raised_by = isClient ? "client" : "vendor";

    // Update booking
    await supabase
      .from("bookings")
      .update({
        booking_status: "disputed",
        dispute_raised_at: new Date().toISOString(),
        dispute_raised_by: raised_by,
      })
      .eq("id", booking_id);

    // Post system message
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", booking.client_id)
      .eq("vendor_id", booking.vendor_id)
      .order("last_message_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (conv) {
      await supabase.from("messages").insert({
        conversation_id: conv.id,
        sender_type: "system",
        sender_user_id: null,
        message_type: "system",
        content: `⚠️ A dispute has been raised on this booking. Umcimbi admin has been notified and will be in touch within 24 hours. Funds are frozen until the dispute is resolved.`,
      });

      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conv.id);
    }

    // Send admin notification email (fail-safe)
    try {
      const adminEmail = Deno.env.get("ADMIN_EMAIL");
      if (adminEmail) {
        await fetch(supabaseUrl + "/functions/v1/send-transactional-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + supabaseServiceKey,
          },
          body: JSON.stringify({
            to: adminEmail,
            subject: `🚨 Dispute raised — Booking ${booking_id}`,
            html: `
              <h2>Dispute Raised on Umcimbi</h2>
              <p><strong>Booking ID:</strong> ${booking_id}</p>
              <p><strong>Raised by:</strong> ${raised_by}</p>
              <p><strong>Raised at:</strong> ${new Date().toISOString()}</p>
              <p><strong>Amount held:</strong> R${booking.balance_amount?.toLocaleString()}</p>
              <p><strong>Client ID:</strong> ${booking.client_id}</p>
              <p><strong>Vendor ID:</strong> ${booking.vendor_id}</p>
              <p><a href="https://www.umcimbi.co.za/admin/bookings/${booking_id}">View booking</a></p>
            `,
          }),
        });
      }
    } catch (emailErr) {
      console.error("Admin dispute email failed:", emailErr);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("raise-dispute error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
