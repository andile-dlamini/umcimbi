import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function sha512Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-512", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse body — Ozow may send form-encoded or JSON
    let body: Record<string, string>;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      body = Object.fromEntries(params.entries());
    } else {
      body = await req.json();
    }

    console.log("Ozow webhook received:", JSON.stringify(body));

    const {
      SiteCode,
      TransactionId,
      TransactionReference,
      Amount,
      Status,
      Optional1,
      Optional2,
      Optional3,
      Optional4,
      Optional5,
      CurrencyCode,
      IsTest,
      StatusMessage,
      Hash,
    } = body;

    // Verify hash
    const OZOW_PRIVATE_KEY = Deno.env.get("OZOW_PRIVATE_KEY")!;

    const hashFields = [
      SiteCode || "",
      TransactionId || "",
      TransactionReference || "",
      Amount || "",
      Status || "",
      Optional1 || "",
      Optional2 || "",
      Optional3 || "",
      Optional4 || "",
      Optional5 || "",
      CurrencyCode || "",
      IsTest || "",
      StatusMessage || "",
    ].join("") + OZOW_PRIVATE_KEY;

    const expectedHash = await sha512Hex(hashFields.toLowerCase());

    if (expectedHash.toLowerCase().replace(/^0+/, "") !== (Hash || "").toLowerCase().replace(/^0+/, "")) {
      console.error("Hash mismatch! Expected:", expectedHash, "Got:", Hash);
      return new Response("invalid hash", { status: 200, headers: corsHeaders });
    }

    const booking_id = Optional1;
    const payment_type = Optional2;

    if (!booking_id || !payment_type) {
      console.error("Missing booking_id or payment_type in webhook");
      return new Response("missing data", { status: 200, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (Status === "Complete") {
      const now = new Date().toISOString();
      const updates: Record<string, unknown> = {
        ozow_transaction_id: TransactionId,
      };

      let bookingForDate: { event_date_time: string | null; deposit_amount: number | null; vendor_id: string | null } | null = null;

      if (payment_type === "deposit") {
        updates.deposit_status = "paid";
        updates.deposit_paid_at = now;
        updates.booking_status = "confirmed";
        updates.balance_status = "due";

        const { data } = await supabase
          .from("bookings")
          .select("event_date_time, deposit_amount, vendor_id")
          .eq("id", booking_id)
          .single();
        bookingForDate = data as typeof bookingForDate;

        if (bookingForDate?.event_date_time) {
          const ceremonyDate = new Date(bookingForDate.event_date_time);
          const balanceDue = new Date(ceremonyDate.getTime() - 5 * 24 * 60 * 60 * 1000);
          updates.balance_due_at = balanceDue > new Date() ? balanceDue.toISOString() : now;
        } else {
          updates.balance_due_at = now;
        }
      } else if (payment_type === "balance") {
        updates.balance_status = "paid";
        updates.balance_paid_at = now;
        updates.booking_status = "confirmed";
        updates.funds_held_since = now;
      }

      const { error: updateError } = await supabase
        .from("bookings")
        .update(updates)
        .eq("id", booking_id);

      if (updateError) {
        console.error("Failed to update booking:", updateError);
      } else {
        try {
          const { fireNotifyVendorEvent } = await import("../_shared/notifyVendorEvent.ts");
          if (payment_type === "deposit") {
            fireNotifyVendorEvent({ event_type: "deposit_paid", booking_id });
          } else if (payment_type === "balance") {
            fireNotifyVendorEvent({ event_type: "balance_paid", booking_id });
          }
        } catch (_e) { /* ignore */ }
      }

      if (payment_type === "deposit" && bookingForDate?.deposit_amount) {
        const vendorDepositAmount = Math.round((Number(bookingForDate.deposit_amount) / 1.08) * 100) / 100;
        try {
          const payoutRes = await fetch(Deno.env.get("SUPABASE_URL")! + "/functions/v1/trigger-vendor-payout", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              booking_id: booking_id,
              payout_type: "deposit",
              override_amount: vendorDepositAmount,
            }),
          });
          const payoutText = await payoutRes.text();
          console.log("[DEPOSIT PAYOUT] status:", payoutRes.status, "body:", payoutText.substring(0, 200));
        } catch (payoutErr) {
          console.error("[DEPOSIT PAYOUT] Trigger failed:", payoutErr);
        }
      }

      // Store payment record
      const amountCents = Amount ? Math.round(parseFloat(Amount) * 100) : null;

      // Get booking to find client_id
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("client_id, vendor_id, deposit_amount, balance_amount")
        .eq("id", booking_id)
        .single();

      if (bookingData) {
        await supabase.from("payment_proofs").insert({
          booking_id,
          payer_user_id: bookingData.client_id,
          kind: payment_type,
          storage_key: `ozow:${TransactionId}`,
          reference_text: `Ozow payment ${TransactionId}`,
          status: "verified",
          reviewed_at: now,
          amount_cents: amountCents,
          payment_method: "ozow",
        });

        // Post system messages to conversation
        const { data: vendorData } = await supabase
          .from("vendors")
          .select("name")
          .eq("id", bookingData.vendor_id)
          .single();
        const vendorName = vendorData?.name || "your vendor";

        const { data: conv } = await supabase
          .from("conversations")
          .select("id")
          .eq("user_id", bookingData.client_id)
          .eq("vendor_id", bookingData.vendor_id)
          .order("last_message_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (conv) {
          if (payment_type === "balance") {
            const amount = bookingData.balance_amount;
            await supabase.from("messages").insert({
              conversation_id: conv.id,
              sender_type: "system",
              sender_user_id: null,
              message_type: "system",
              content: `✅ Your balance payment of R${amount?.toLocaleString()} is secured and held by Umcimbi. Your vendor has been notified and is ready to deliver. After the service, you will be asked to confirm delivery to release funds. You're all set! 🎉`,
              metadata: { visibility: "client" },
            });
            await supabase.from("messages").insert({
              conversation_id: conv.id,
              sender_type: "system",
              sender_user_id: null,
              message_type: "system",
              content: `💰 The balance payment of R${amount?.toLocaleString()} has been received and is held securely by Umcimbi. Once you have delivered your service, upload your proof of delivery from this booking to release your payment. Funds clear within 48 hours of upload.`,
              metadata: { visibility: "vendor" },
            });
          } else {
            const amount = bookingData.deposit_amount;
            await supabase.from("messages").insert({
              conversation_id: conv.id,
              sender_type: "system",
              sender_user_id: null,
              message_type: "system",
              content: `✅ Deposit payment of R${amount?.toLocaleString()} confirmed. Booking is now active!`,
              metadata: { visibility: "both" },
            });

            // Balance due reminders
            const balanceDueIso = (updates.balance_due_at as string | undefined) || now;
            const balanceDueDateFormatted = new Date(balanceDueIso).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            const { data: clientProfile } = await supabase
              .from("profiles")
              .select("full_name, first_name")
              .eq("user_id", bookingData.client_id)
              .single();
            const clientName =
              clientProfile?.full_name || clientProfile?.first_name || "The client";

            await supabase.from("messages").insert({
              conversation_id: conv.id,
              sender_type: "system",
              sender_user_id: null,
              message_type: "system",
              content: `⏰ Your balance of R${bookingData?.balance_amount?.toLocaleString()} is due by ${balanceDueDateFormatted}. You can pay early anytime from your orders.`,
              metadata: { visibility: "client" },
            });
            await supabase.from("messages").insert({
              conversation_id: conv.id,
              sender_type: "system",
              sender_user_id: null,
              message_type: "system",
              content: `⏰ ${clientName} has until ${balanceDueDateFormatted} to pay the balance of R${bookingData?.balance_amount?.toLocaleString()}.`,
              metadata: { visibility: "vendor" },
            });
          }

          await supabase
            .from("conversations")
            .update({ last_message_at: new Date().toISOString() })
            .eq("id", conv.id);
        }
      }

      console.log(`Ozow payment ${payment_type} confirmed for booking ${booking_id}`);
    } else {
      console.log(`Ozow payment status: ${Status} for booking ${booking_id} (${payment_type})`);
    }

    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Ozow webhook error:", err);
    return new Response("error", { status: 200, headers: corsHeaders });
  }
});
