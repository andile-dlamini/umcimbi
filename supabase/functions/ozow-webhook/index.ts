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
      IsTest || "",
      StatusMessage || "",
    ].join("") + OZOW_PRIVATE_KEY;

    const expectedHash = await sha512Hex(hashFields.toLowerCase());

    if (expectedHash.toLowerCase() !== (Hash || "").toLowerCase()) {
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

      if (payment_type === "deposit") {
        updates.deposit_status = "paid";
        updates.deposit_paid_at = now;
        updates.booking_status = "confirmed";
        updates.balance_status = "due";
        updates.balance_due_at = now;
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
              content: `✅ Your balance payment of R${amount?.toLocaleString()} has been received and is securely held by Umcimbi. Funds will be released to ${vendorName} after your ceremony. You're all set! 🎉`,
            });
            await supabase.from("messages").insert({
              conversation_id: conv.id,
              sender_type: "system",
              sender_user_id: null,
              message_type: "system",
              content: `💰 Great news! The balance payment of R${amount?.toLocaleString()} for this booking has been received and is being held securely by Umcimbi pending your ceremony date. Funds will be released to you automatically after the service is delivered. No action needed from you.`,
            });
          } else {
            const amount = bookingData.deposit_amount;
            await supabase.from("messages").insert({
              conversation_id: conv.id,
              sender_type: "system",
              sender_user_id: null,
              message_type: "system",
              content: `✅ Deposit payment of R${amount?.toLocaleString()} confirmed. Booking is now active!`,
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
