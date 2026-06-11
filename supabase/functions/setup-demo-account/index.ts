import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEMO_PHONE = "+27820000901";
const DEMO_PHONE_LOCAL = "0820000901";
const DEMO_EMAIL = "27820000901@phone.isiko.app";
const DEMO_PASSWORD = "Demo123!";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const expectedAuth = `Bearer ${serviceKey}`;
  if (req.headers.get("authorization") !== expectedAuth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceKey
    );

    // 1. Remove any existing demo users with this phone/email
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list.users.filter(
      (u) => u.email === DEMO_EMAIL || u.phone === DEMO_PHONE.replace("+", "")
    );
    for (const u of existing) {
      await supabase.auth.admin.deleteUser(u.id);
    }

    // 2. Create the auth user (handle_new_user trigger creates profile + 'user' role)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      phone: DEMO_PHONE,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        first_name: "Demo",
        surname: "User",
        full_name: "Demo User",
      },
    });

    if (authError || !authData.user) {
      throw authError ?? new Error("User creation failed");
    }

    const userId = authData.user.id;

    // 3. Complete profile
    await supabase
      .from("profiles")
      .update({
        first_name: "Demo",
        surname: "User",
        full_name: "Demo User",
        phone_number: DEMO_PHONE,
        phone_verified: true,
        is_profile_complete: true,
      })
      .eq("user_id", userId);

    // 4. Add vendor role
    await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "vendor" });

    // 5. Create the hidden demo vendor (is_active=false hides from marketplace
    //    via the "Active vendors viewable by authenticated users" RLS policy,
    //    while the owner can still SELECT via the owner-self policy).
    const { error: vendorError } = await supabase.from("vendors").insert({
      owner_user_id: userId,
      name: "Demo Vendor (Sandbox)",
      category: "catering",
      about:
        "DEMO ONLY — this vendor is hidden from the marketplace and cannot receive real quotes, orders or payments. For platform demonstration use only.",
      location: "Demo, ZA",
      phone_number: DEMO_PHONE,
      is_active: false,
      signup_source: "demo_sandbox",
    });

    if (vendorError) {
      console.error("Vendor insert error:", vendorError);
      throw vendorError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Demo account ready",
        login: {
          phone: DEMO_PHONE_LOCAL,
          otp_for_signup: "123456",
        },
        user_id: userId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("setup-demo-account error:", error);
    return new Response(
      JSON.stringify({ error: String(error?.message ?? error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
