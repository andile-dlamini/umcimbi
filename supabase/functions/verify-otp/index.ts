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

interface RegisterData {
  phone_number: string;
  otp: string;
  first_name: string;
  surname: string;
  address?: string;
  email?: string;
  password: string;
  role?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RegisterData = await req.json();
    const { phone_number, otp, first_name, surname, address, email, password, role } = body;

    if (!phone_number || !otp || !first_name || !surname || !password) {
      return new Response(
        JSON.stringify({ error: "All required fields must be provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
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

    // Create user account via Supabase Auth
    const signUpEmail = email && email.trim() ? email.trim() : `${normalized.replace("+", "")}@phone.isiko.app`;
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: signUpEmail,
      password,
      phone: normalized,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        first_name: first_name.trim(),
        surname: surname.trim(),
        full_name: `${first_name.trim()} ${surname.trim()}`,
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      if (authError.message.includes("already been registered") || authError.message.includes("already exists")) {
        return new Response(
          JSON.stringify({ error: "An account with this information already exists. Try logging in." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error("User creation failed");
    }

    // Update profile with registration details
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        first_name: first_name.trim(),
        surname: surname.trim(),
        full_name: `${first_name.trim()} ${surname.trim()}`,
        phone_number: normalized,
        phone_verified: true,
        address: address?.trim() || null,
        email: email?.trim() || null,
      })
      .eq("user_id", authData.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account created successfully!",
        user_id: authData.user.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("verify-otp error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
