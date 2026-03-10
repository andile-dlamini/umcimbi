import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface ResetData {
  phone_number: string;
  otp: string;
  new_password: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ResetData = await req.json();
    const { phone_number, otp, new_password } = body;

    if (!phone_number || !otp || !new_password) {
      return new Response(
        JSON.stringify({ error: "Phone number, OTP, and new password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new_password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize phone
    let normalized = phone_number.replace(/\s/g, "");
    if (normalized.startsWith("0")) {
      normalized = "+27" + normalized.slice(1);
    }
    if (!normalized.startsWith("+")) {
      normalized = "+" + normalized;
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find latest OTP request for this phone
    const { data: otpRecords, error: fetchError } = await supabase
      .from("otp_requests")
      .select("*")
      .eq("phone_number", normalized)
      .eq("verified", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    if (!otpRecords || otpRecords.length === 0) {
      return new Response(
        JSON.stringify({ error: "No verification code found. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const otpRecord = otpRecords[0];

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Verification code has expired. Please request a new one.", expired: true }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check attempt count
    if (otpRecord.attempt_count >= otpRecord.max_attempts) {
      return new Response(
        JSON.stringify({ error: "Too many attempts. Please request a new verification code.", locked: true }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment attempt count
    await supabase
      .from("otp_requests")
      .update({ attempt_count: otpRecord.attempt_count + 1 })
      .eq("id", otpRecord.id);

    // Verify OTP hash
    const inputHash = await hashOtp(otp);
    if (inputHash !== otpRecord.otp_hash) {
      const remaining = otpRecord.max_attempts - otpRecord.attempt_count - 1;
      return new Response(
        JSON.stringify({
          error: `Invalid verification code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
          attempts_remaining: remaining,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // OTP verified! Mark as verified
    await supabase
      .from("otp_requests")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    // Find the user by their shadow email
    const shadowEmail = `${normalized.replace("+", "")}@phone.isiko.app`;

    // List users to find the one with this email
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
      perPage: 1,
      page: 1,
    });

    if (listError) throw listError;

    // Search by email through all users - use a more targeted approach
    // We look up the profile by phone number to get the user_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("phone_number", normalized)
      .limit(1)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "No account found with this phone number." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the user's password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      profile.user_id,
      { password: new_password }
    );

    if (updateError) {
      console.error("Password update error:", updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Password reset successfully!",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("reset-password error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
