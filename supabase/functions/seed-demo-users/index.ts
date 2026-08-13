import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-seed-token",
};

// Seeds two throwaway demo logins against the live database.
// The vendor profile is created hidden (is_active = false, is_demo = true) so it
// never appears in public browsing, the marketplace view or the public directory.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const seedToken = Deno.env.get("DEMO_SEED_TOKEN") ?? "";
  const provided =
    req.headers.get("x-seed-token") ?? "";
  const authHeader = req.headers.get("authorization") ?? "";

  const authorized =
    authHeader === `Bearer ${serviceKey}` ||
    (seedToken.length > 0 && provided === seedToken);

  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);

  const password = "Demo123!";
  const accounts = [
    {
      phone: "+27820000901",
      first_name: "Demo",
      surname: "Organiser",
      role: "user" as const,
    },
    {
      phone: "+27820000902",
      first_name: "Demo",
      surname: "Vendor",
      role: "vendor" as const,
    },
  ].map((a) => ({ ...a, email: `${a.phone.replace("+", "")}@phone.isiko.app` }));

  const results: any[] = [];

  for (const acc of accounts) {
    const phoneNoPlus = acc.phone.replace("+", "");

    // Remove any previous version of this demo account
    const { data: existing } = await supabase.auth.admin.listUsers();
    for (const u of existing.users.filter(
      (u) => u.email === acc.email || u.phone === phoneNoPlus
    )) {
      await supabase.from("vendors").delete().eq("owner_user_id", u.id);
      await supabase.auth.admin.deleteUser(u.id);
    }

    const { data: created, error } = await supabase.auth.admin.createUser({
      email: acc.email,
      password,
      phone: acc.phone,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        first_name: acc.first_name,
        surname: acc.surname,
        full_name: `${acc.first_name} ${acc.surname}`,
      },
    });

    if (error || !created.user) {
      results.push({ email: acc.email, error: error?.message });
      continue;
    }

    await supabase
      .from("profiles")
      .update({
        first_name: acc.first_name,
        surname: acc.surname,
        full_name: `${acc.first_name} ${acc.surname}`,
        phone_number: acc.phone,
        phone_verified: true,
        is_profile_complete: true,
        is_demo: true,
        email: acc.email,
      })
      .eq("user_id", created.user.id);

    let vendorId: string | null = null;

    if (acc.role === "vendor") {
      await supabase
        .from("user_roles")
        .insert({ user_id: created.user.id, role: "vendor" });

      const { data: vendor, error: vErr } = await supabase
        .from("vendors")
        .insert({
          owner_user_id: created.user.id,
          name: "Demo Vendor (Testing)",
          category: "catering",
          vendor_business_type: "independent",
          business_verification_status: "verified",
          about:
            "Internal demo account used for testing the vendor experience. Not a real service provider.",
          location: "Durban",
          city: "Durban",
          state_province: "KwaZulu-Natal",
          country: "South Africa",
          phone_number: acc.phone,
          whatsapp_number: acc.phone,
          email: acc.email,
          is_active: false, // hidden from all public browsing surfaces
          is_demo: true,
        })
        .select("id")
        .single();

      if (vErr) {
        results.push({ email: acc.email, user_id: created.user.id, error: vErr.message });
        continue;
      }
      vendorId = vendor.id;
    }

    results.push({
      email: acc.email,
      phone: acc.phone,
      user_id: created.user.id,
      vendor_id: vendorId,
      ok: true,
    });
  }

  return new Response(
    JSON.stringify({ ok: true, password, results }, null, 2),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
