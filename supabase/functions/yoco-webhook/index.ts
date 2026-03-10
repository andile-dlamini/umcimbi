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
    const body = await req.json();
    console.log("Yoco webhook received:", JSON.stringify(body));

    // Yoco sends event type "payment.succeeded" on successful payment
    const eventType = body.type;
    if (eventType !== "payment.succeeded") {
      console.log("Ignoring event type:", eventType);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = body.payload;
    const metadata = payload?.metadata;

    if (!metadata?.bookingId || !metadata?.kind) {
      console.error("Missing metadata in webhook payload");
      return new Response(JSON.stringify({ error: "Missing metadata" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { bookingId, kind } = metadata;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update booking payment status
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = {};
    if (kind === "deposit") {
      updates.deposit_status = "paid";
      updates.deposit_paid_at = now;
      updates.booking_status = "confirmed";
      updates.balance_status = "due";
      updates.balance_due_at = now;
    } else if (kind === "balance") {
      updates.balance_status = "paid";
      updates.balance_paid_at = now;
      updates.booking_status = "completed";
    } else if (kind === "full") {
      updates.deposit_status = "paid";
      updates.deposit_paid_at = now;
      updates.balance_status = "paid";
      updates.balance_paid_at = now;
      updates.booking_status = "completed";
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", bookingId);

    if (updateError) {
      console.error("Failed to update booking:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update booking" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store payment record with full Yoco metadata
    const checkoutId = payload?.id || body?.id || null;
    const amountCents = payload?.amount || null;
    const paymentMethod = payload?.paymentMethodDetails?.type
      || payload?.payment_method_details?.type
      || payload?.paymentMethod?.type
      || null;
    const yocoProcessedAt = payload?.createdDate || payload?.created_date || body?.createdDate || null;

    await supabase.from("payment_proofs").insert({
      booking_id: bookingId,
      payer_user_id: metadata.userId,
      kind,
      storage_key: `yoco:${checkoutId}`,
      reference_text: `Yoco payment ${checkoutId}`,
      status: "verified",
      reviewed_at: new Date().toISOString(),
      yoco_checkout_id: checkoutId,
      amount_cents: amountCents,
      payment_method: paymentMethod,
      yoco_processed_at: yocoProcessedAt,
    });

    // Post system message to conversation
    const { data: booking } = await supabase
      .from("bookings")
      .select("client_id, vendor_id, deposit_amount, balance_amount")
      .eq("id", bookingId)
      .single();

    if (booking) {
      const { data: conv } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", booking.client_id)
        .eq("vendor_id", booking.vendor_id)
        .order("last_message_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (conv) {
        let content: string;

        if (kind === "full") {
          const totalAmount = (booking.deposit_amount || 0) + (booking.balance_amount || 0);
          content = `✅ Full payment of R${totalAmount?.toLocaleString()} confirmed. Booking is now completed!`;
        } else {
          const label = kind === "deposit" ? "Deposit" : "Balance";
          const amount = kind === "deposit" ? booking.deposit_amount : booking.balance_amount;
          content = kind === "balance"
            ? `✅ ${label} payment of R${amount?.toLocaleString()} confirmed. Booking is now completed!`
            : `✅ ${label} payment of R${amount?.toLocaleString()} confirmed. Booking is now active!`;
        }

        await supabase.from("messages").insert({
          conversation_id: conv.id,
          sender_type: "system",
          sender_user_id: metadata.userId,
          message_type: "system",
          content,
        });

        // If booking is now completed, send review prompt
        const isCompleted = kind === "balance" || kind === "full";
        if (isCompleted) {
          // Find the booking ID for linking
          await supabase.from("messages").insert({
            conversation_id: conv.id,
            sender_type: "system",
            sender_user_id: null,
            message_type: "review_prompt",
            content: "⭐ How was the experience? Tap below to leave a review.",
            metadata: { booking_id: bookingId },
          });
        }

        await supabase
          .from("conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", conv.id);
      }
    }

    console.log(`Payment ${kind} confirmed for booking ${bookingId}`);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
