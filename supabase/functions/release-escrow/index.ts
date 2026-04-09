import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function releaseBooking(bookingId: string, supabase: any, supabaseUrl: string, serviceKey: string): Promise<boolean> {
  // Fetch booking
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, client_id, vendor_id, balance_amount, booking_status")
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    console.log(`releaseBooking: booking ${bookingId} not found`);
    return false;
  }

  if (booking.booking_status !== "confirmed") {
    console.log(`releaseBooking: booking ${bookingId} status is ${booking.booking_status}, skipping`);
    return false;
  }

  // Update booking
  await supabase
    .from("bookings")
    .update({
      booking_status: "completed",
      funds_released_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  // Fetch vendor name
  const { data: vendor } = await supabase
    .from("vendors")
    .select("name")
    .eq("id", booking.vendor_id)
    .single();

  const vendorName = vendor?.name || "your vendor";

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
    await supabase.from("messages").insert({
      conversation_id: conv.id,
      sender_type: "system",
      sender_user_id: null,
      message_type: "system",
      content: `🎉 Funds of R${booking.balance_amount?.toLocaleString()} have been released to ${vendorName}. Thank you for using Umcimbi!`,
    });

    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conv.id);
  }

  // Invoke trigger-vendor-payout
  try {
    await fetch(supabaseUrl + "/functions/v1/trigger-vendor-payout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + serviceKey,
      },
      body: JSON.stringify({ booking_id: bookingId }),
    });
  } catch (payoutErr) {
    console.error("trigger-vendor-payout call failed:", payoutErr);
  }

  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { booking_id, mode } = await req.json();

    if (mode === "client_confirmed" || mode === "admin") {
      if (!booking_id) {
        return new Response(JSON.stringify({ error: "booking_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await releaseBooking(booking_id, supabase, supabaseUrl, supabaseServiceKey);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "auto") {
      // Query eligible bookings
      const { data: eligibleBookings } = await supabase
        .from("bookings")
        .select("id")
        .eq("booking_status", "confirmed")
        .not("funds_held_since", "is", null)
        .is("client_confirmed_at", null)
        .is("funds_released_at", null);

      if (!eligibleBookings || eligibleBookings.length === 0) {
        return new Response(JSON.stringify({ success: true, released: 0 }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let released = 0;

      for (const bk of eligibleBookings) {
        const { data: proofs } = await supabase
          .from("delivery_proofs")
          .select("created_at")
          .eq("booking_id", bk.id)
          .order("created_at", { ascending: true })
          .limit(1);

        if (proofs && proofs.length > 0) {
          const proofTime = new Date(proofs[0].created_at).getTime();
          const now = Date.now();
          const hoursDiff = (now - proofTime) / (1000 * 60 * 60);

          if (hoursDiff >= 48) {
            const result = await releaseBooking(bk.id, supabase, supabaseUrl, supabaseServiceKey);
            if (result) released++;
          }
        }
      }

      return new Response(JSON.stringify({ success: true, released }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid mode" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("release-escrow error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
