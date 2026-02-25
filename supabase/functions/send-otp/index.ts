import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple hash function for OTP (using Web Crypto API)
async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone_number } = await req.json();

    if (!phone_number || typeof phone_number !== "string") {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize to E.164
    let normalized = phone_number.replace(/\s/g, "");
    if (normalized.startsWith("0")) {
      normalized = "+27" + normalized.slice(1);
    }
    if (!normalized.startsWith("+")) {
      normalized = "+" + normalized;
    }

    // Basic validation
    if (!/^\+\d{10,15}$/.test(normalized)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const connectMobileKey = Deno.env.get("CONNECT_MOBILE_API_KEY");

    if (!connectMobileKey) {
      throw new Error("CONNECT_MOBILE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Rate limiting: check sends in last 15 minutes
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: recentSends, error: countError } = await supabase
      .from("otp_requests")
      .select("id, send_count, last_sent_at")
      .eq("phone_number", normalized)
      .gte("created_at", fifteenMinAgo)
      .order("created_at", { ascending: false });

    if (countError) throw countError;

    const totalSendsInWindow = recentSends?.reduce((sum, r) => sum + (r.send_count || 1), 0) || 0;

    if (totalSendsInWindow >= 3) {
      // Generic message to prevent enumeration
      return new Response(
        JSON.stringify({ success: true, message: "If this number can be used, a verification code was sent." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check cooldown (30 seconds)
    if (recentSends && recentSends.length > 0) {
      const lastSent = new Date(recentSends[0].last_sent_at).getTime();
      const cooldownMs = 30 * 1000;
      if (Date.now() - lastSent < cooldownMs) {
        return new Response(
          JSON.stringify({ error: "Please wait before requesting a new code", cooldown: true }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Store hashed OTP
    const { error: insertError } = await supabase.from("otp_requests").insert({
      phone_number: normalized,
      otp_hash: otpHash,
      expires_at: expiresAt,
      attempt_count: 0,
      max_attempts: 5,
      send_count: 1,
      last_sent_at: new Date().toISOString(),
      verified: false,
    });

    if (insertError) throw insertError;

    // Send SMS via Connect Mobile API
    const smsPhone = normalized.replace("+", "");
    const smsResponse = await fetch("https://sms.connect-mobile.co.za/submit/single/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${connectMobileKey}`,
      },
      body: JSON.stringify({
        da: smsPhone,
        ud: `UMCIMBI: Your verification code is ${otp}. It expires in 5 minutes. Don't share this code.`,
      }),
    });

    if (!smsResponse.ok) {
      const errBody = await smsResponse.text();
      console.error("Connect Mobile error:", errBody);
      // Still return success to prevent enumeration
    }

    return new Response(
      JSON.stringify({ success: true, message: "If this number can be used, a verification code was sent." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-otp error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
