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
      .select("id, client_id, vendor_id, balance_amount, booking_status, order_number")
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

    // Post system message — find conversation containing this booking's order_number
    const { data: convMessages } = await supabase
      .from("messages")
      .select("conversation_id")
      .ilike("content", `%${booking.order_number}%`)
      .limit(1)
      .maybeSingle();
    const conv = convMessages ? { id: convMessages.conversation_id } : null;

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

    // Send admin notification email via the working enqueue_email pattern
    // (matches auth-email-hook). The transactional_emails pgmq queue is drained
    // by the process-email-queue cron, which actually delivers the email.
    try {
      const adminEmail = Deno.env.get("ADMIN_EMAIL");
      if (adminEmail) {
        const messageId = crypto.randomUUID();
        const raisedAt = new Date().toISOString();
        const amountHeld = booking.balance_amount
          ? `R${Number(booking.balance_amount).toLocaleString("en-ZA")}`
          : "Unknown";
        const subject = `Dispute raised — Booking ${booking_id}`;

        // Log pending BEFORE enqueue so we have a record even if enqueue crashes
        await supabase.from("email_send_log").insert({
          message_id: messageId,
          template_name: "admin_dispute_alert",
          recipient_email: adminEmail,
          status: "pending",
        });

        const html = `<!DOCTYPE html>
<html><body style="font-family: Arial, sans-serif; background:#ffffff; color:#1a1a1a; padding:24px;">
  <div style="max-width:560px; margin:0 auto; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;">
    <div style="background:#4B0082; color:#ffffff; padding:20px 24px;">
      <h2 style="margin:0; font-size:20px;">Dispute raised</h2>
      <p style="margin:4px 0 0; font-size:13px; opacity:0.85;">Action required</p>
    </div>
    <div style="padding:24px;">
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        <tr><td style="padding:6px 0; color:#555;">Booking ID</td><td style="padding:6px 0;"><strong>${booking_id}</strong></td></tr>
        <tr><td style="padding:6px 0; color:#555;">Raised by</td><td style="padding:6px 0;"><strong>${raised_by}</strong></td></tr>
        <tr><td style="padding:6px 0; color:#555;">Raised at</td><td style="padding:6px 0;">${raisedAt}</td></tr>
        <tr><td style="padding:6px 0; color:#555;">Amount held</td><td style="padding:6px 0;"><strong>${amountHeld}</strong></td></tr>
        <tr><td style="padding:6px 0; color:#555;">Client ID</td><td style="padding:6px 0;">${booking.client_id}</td></tr>
        <tr><td style="padding:6px 0; color:#555;">Vendor ID</td><td style="padding:6px 0;">${booking.vendor_id}</td></tr>
      </table>
      <div style="margin-top:24px;">
        <a href="https://www.umcimbi.co.za/admin/bookings/${booking_id}" style="display:inline-block; background:#4B0082; color:#ffffff; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:600;">View booking</a>
      </div>
    </div>
    <div style="padding:14px 24px; background:#f9fafb; font-size:12px; color:#6b7280;">UMCIMBI admin alert</div>
  </div>
</body></html>`;

        const text = `Dispute raised on UMCIMBI

Booking ID: ${booking_id}
Raised by: ${raised_by}
Raised at: ${raisedAt}
Amount held: ${amountHeld}
Client ID: ${booking.client_id}
Vendor ID: ${booking.vendor_id}

View booking: https://www.umcimbi.co.za/admin/bookings/${booking_id}`;

        // Get or create unsubscribe token for this admin email (required by email API)
        let unsubscribeToken: string | null = null;
        const { data: existingToken } = await supabase
          .from("email_unsubscribe_tokens")
          .select("token")
          .eq("email", adminEmail)
          .maybeSingle();
        if (existingToken?.token) {
          unsubscribeToken = existingToken.token;
        } else {
          unsubscribeToken = crypto.randomUUID();
          await supabase
            .from("email_unsubscribe_tokens")
            .insert({ email: adminEmail, token: unsubscribeToken });
        }

        const { error: enqueueError } = await supabase.rpc("enqueue_email", {
          queue_name: "transactional_emails",
          payload: {
            message_id: messageId,
            to: adminEmail,
            from: "UMCIMBI <noreply@mail.umcimbi.co.za>",
            sender_domain: "mail.umcimbi.co.za",
            subject,
            html,
            text,
            purpose: "transactional",
            idempotency_key: `admin-dispute-alert-${booking_id}-${messageId}`,
            label: "admin_dispute_alert",
            unsubscribe_token: unsubscribeToken,
            queued_at: new Date().toISOString(),
          },
        });

        if (enqueueError) {
          console.error("Failed to enqueue dispute email:", enqueueError);
          await supabase.from("email_send_log")
            .update({ status: "failed", error_message: "Failed to enqueue: " + enqueueError.message })
            .eq("message_id", messageId);
        }
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
