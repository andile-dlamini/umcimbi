import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEMO_PASSWORD = "Demo123!";

type DemoAccount = {
  phone: string; // E.164
  first_name: string;
  surname: string;
  role: "vendor" | "user";
  vendor_name?: string;
};

const ACCOUNTS: DemoAccount[] = [
  {
    phone: "+27710000002",
    first_name: "Maswazi",
    surname: "Catering",
    role: "vendor",
    vendor_name: "Maswazi Catering",
  },
  {
    phone: "+27710000003",
    first_name: "Isizwe",
    surname: "Catering",
    role: "vendor",
    vendor_name: "Isizwe Catering",
  },
  {
    phone: "+27710000004",
    first_name: "Luyanda",
    surname: "Demo",
    role: "user",
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results: any[] = [];

    for (const acc of ACCOUNTS) {
      const email = `${acc.phone.replace("+", "")}@phone.isiko.app`;
      const phoneNoPlus = acc.phone.replace("+", "");

      // Remove existing matches
      const { data: list } = await supabase.auth.admin.listUsers();
      const matches = list.users.filter(
        (u) => u.email === email || u.phone === phoneNoPlus
      );
      for (const m of matches) {
        await supabase.auth.admin.deleteUser(m.id);
      }

      // Create auth user
      const { data: created, error: createErr } =
        await supabase.auth.admin.createUser({
          email,
          password: DEMO_PASSWORD,
          phone: acc.phone,
          email_confirm: true,
          phone_confirm: true,
          user_metadata: {
            first_name: acc.first_name,
            surname: acc.surname,
            full_name: `${acc.first_name} ${acc.surname}`,
          },
        });

      if (createErr || !created.user) {
        results.push({ phone: acc.phone, error: createErr?.message });
        continue;
      }

      const userId = created.user.id;

      // Complete profile + mark as demo
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
          email,
        })
        .eq("user_id", userId);

      // Vendor: add role + vendor row (hidden by default)
      if (acc.role === "vendor") {
        await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "vendor" });

        const { error: vendorErr } = await supabase.from("vendors").insert({
          owner_user_id: userId,
          name: acc.vendor_name!,
          category: "catering",
          about:
            "DEMO ONLY — this vendor is a sandbox account used for platform demonstrations. Visibility on the live marketplace can be toggled on or off by the team.",
          location: "Demo, ZA",
          phone_number: acc.phone,
          is_active: false,
          signup_source: "demo_sandbox",
        });

        if (vendorErr) {
          results.push({
            phone: acc.phone,
            user_id: userId,
            error: `vendor: ${vendorErr.message}`,
          });
          continue;
        }
      }

      results.push({
        phone: acc.phone,
        user_id: userId,
        role: acc.role,
        ok: true,
      });
    }

    return new Response(
      JSON.stringify(
        {
          ok: true,
          password: DEMO_PASSWORD,
          results,
        },
        null,
        2
      ),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("setup-demo-accounts error:", error);
    return new Response(
      JSON.stringify({ error: String(error?.message ?? error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
