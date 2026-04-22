import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticate user
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

    const { booking_id, payment_type } = await req.json();

    if (!booking_id || !payment_type || !["deposit", "balance"].includes(payment_type)) {
      return new Response(JSON.stringify({ error: "Invalid parameters. payment_type must be 'deposit' or 'balance'." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("id, client_id, vendor_id, deposit_amount, balance_amount, deposit_status, balance_status, booking_status")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (booking.client_id !== user.id) {
      console.error("DIAG: client_id mismatch", { booking_client: booking.client_id, user_id: user.id });
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate payment is due
    if (payment_type === "deposit" && booking.deposit_status === "paid") {
      console.error("DIAG: deposit already paid", { deposit_status: booking.deposit_status });
      return new Response(JSON.stringify({ error: "Deposit already paid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (payment_type === "balance" && booking.balance_status === "paid") {
      console.error("DIAG: balance already paid", { balance_status: booking.balance_status });
      return new Response(JSON.stringify({ error: "Balance already paid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amount = payment_type === "deposit" ? booking.deposit_amount : booking.balance_amount;
    if (!amount || amount <= 0) {
      console.error("DIAG: invalid amount", { amount, payment_type, deposit_amount: booking.deposit_amount, balance_amount: booking.balance_amount });
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ozow config
    const OZOW_API_URL = (Deno.env.get("OZOW_API_URL") ?? "https://api.ozow.com/PostPaymentRequest").trim();
    const OZOW_SITE_CODE = (Deno.env.get("OZOW_SITE_CODE") ?? "").trim();
    const OZOW_PRIVATE_KEY = (Deno.env.get("OZOW_PRIVATE_KEY") ?? "").trim();
    const OZOW_API_KEY = (Deno.env.get("OZOW_API_KEY") ?? "").trim();
    const successUrl = (Deno.env.get("OZOW_SUCCESS_URL") ?? "").trim();
    const errorUrl = (Deno.env.get("OZOW_ERROR_URL") ?? "").trim();
    const cancelUrl = (Deno.env.get("OZOW_CANCEL_URL") ?? "").trim();
    const notifyUrl = (Deno.env.get("OZOW_NOTIFY_URL") ?? "").trim();

    console.log("DIAG: secrets check", { 
      hasSiteCode: !!OZOW_SITE_CODE, 
      hasPrivateKey: !!OZOW_PRIVATE_KEY, 
      hasApiKey: !!OZOW_API_KEY,
      hasSuccessUrl: !!successUrl,
      hasNotifyUrl: !!notifyUrl,
      notifyUrl
    });

    if (!OZOW_SITE_CODE || !OZOW_PRIVATE_KEY || !OZOW_API_KEY) {
      console.error("DIAG: missing Ozow secrets", { hasSiteCode: !!OZOW_SITE_CODE, hasPrivateKey: !!OZOW_PRIVATE_KEY, hasApiKey: !!OZOW_API_KEY });
      return new Response(JSON.stringify({ error: "Payment service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ozow max 50 chars for TransactionReference. Use short booking_id prefix.
    const shortId = booking_id.replace(/-/g, '').slice(0, 20);
    const TransactionReference = `UMC-${payment_type === 'deposit' ? 'D' : 'B'}-${shortId}`;
    const BankReference = `UMC-${booking_id.slice(0, 8).toUpperCase()}`;
    const Amount = amount.toFixed(2);
    const CountryCode = "ZA";
    const CurrencyCode = "ZAR";
    const IsTest = "false";
    const Optional1 = booking_id;
    const Optional2 = payment_type;
    const Optional3 = "";
    const Optional4 = "";
    const Optional5 = "";

    // Build hash: concatenate fields in order, append private key, lowercase, SHA512
    const hashInput = [
      OZOW_SITE_CODE,
      CountryCode,
      CurrencyCode,
      Amount,
      TransactionReference,
      BankReference,
      Optional1,
      Optional2,
      Optional3,
      Optional4,
      Optional5,
      cancelUrl,
      errorUrl,
      successUrl,
      notifyUrl,
      IsTest,
    ].join("") + OZOW_PRIVATE_KEY;

    const HashCheck = await sha512Hex(hashInput.toLowerCase());

    const ozowPayload = {
      SiteCode: OZOW_SITE_CODE,
      CountryCode,
      CurrencyCode,
      Amount,
      TransactionReference,
      BankReference,
      Optional1,
      Optional2,
      Optional3,
      Optional4,
      Optional5,
      IsTest,
      NotifyUrl: notifyUrl,
      SuccessUrl: successUrl,
      ErrorUrl: errorUrl,
      CancelUrl: cancelUrl,
      HashCheck,
    };

    console.log("Ozow payload (no key):", JSON.stringify({
      ...ozowPayload,
      HashCheck: ozowPayload.HashCheck.slice(0, 8) + "...",
    }));
    console.log("Private key length:", OZOW_PRIVATE_KEY.length);
    console.log("Site code:", OZOW_SITE_CODE);

    const ozowRes = await fetch(OZOW_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ApiKey: OZOW_API_KEY,
      },
      body: JSON.stringify(ozowPayload),
    });

    const ozowData = await ozowRes.json();

    if (!ozowRes.ok || ozowData.errorMessage) {
      console.error("Ozow API status:", ozowRes.status);
      console.error("Ozow API response:", JSON.stringify(ozowData));
      return new Response(
        JSON.stringify({ 
          error: "Failed to create payment session", 
          details: ozowData 
        }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ paymentUrl: ozowData.url || ozowData.paymentUrl || ozowData.redirectUrl }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Create Ozow payment error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
