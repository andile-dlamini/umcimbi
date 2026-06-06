import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ACCOUNTS = [
  {
    phone: "+27710000002",
    email: "27710000002@phone.isiko.app",
    first_name: "Luyanda",
    surname: "Dlamini",
    role: "planner",
  },
  {
    phone: "+27710000003",
    email: "27710000003@phone.isiko.app",
    first_name: "Maswazi",
    surname: "Ngcobo",
    role: "vendor",
    vendor: {
      name: "Maswazi Catering",
      category: "catering",
      about: "We specialise in traditional Zulu ceremony catering across eThekwini. From Umembeso spreads to full Umabo feasts — fresh, generous, and on time.",
      location: "Umlazi, KwaZulu-Natal",
      price_range_text: "From R3,500",
    },
  },
  {
    phone: "+27710000004",
    email: "27710000004@phone.isiko.app",
    first_name: "Anele",
    surname: "Mkhize",
    role: "vendor",
    vendor: {
      name: "Anele Catering",
      category: "catering",
      about: "Family catering business serving KZN ceremonies for over 10 years. We bring the warmth of home cooking to every Umemulo, Umabo, and Lobola celebration.",
      location: "Pinetown, KwaZulu-Natal",
      price_range_text: "From R2,800",
    },
  },
];

const PASSWORD = "RecordUmcimbi2026!";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  // Idempotent setup of fixed demo recording accounts. No auth check needed:
  // re-invocation only resets the same 3 hardcoded phone numbers.

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
  const results: any[] = [];

  for (const acc of ACCOUNTS) {
    try {
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list.users.filter(
        (u) => u.email === acc.email || u.phone === acc.phone.replace("+", "")
      );
      for (const u of existing) await supabase.auth.admin.deleteUser(u.id);

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: PASSWORD,
        phone: acc.phone,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: {
          first_name: acc.first_name,
          surname: acc.surname,
          full_name: acc.first_name + " " + acc.surname,
        },
      });

      if (authError || !authData.user) throw authError ?? new Error("User creation failed");
      const userId = authData.user.id;

      await supabase.from("profiles").update({
        first_name: acc.first_name,
        surname: acc.surname,
        full_name: acc.first_name + " " + acc.surname,
        phone_number: acc.phone,
        phone_verified: true,
        is_profile_complete: true,
        is_demo: true,
      }).eq("user_id", userId);

      if (acc.role === "vendor" && acc.vendor) {
        await supabase.from("user_roles").insert({ user_id: userId, role: "vendor" });
        await supabase.from("vendors").insert({
          owner_user_id: userId,
          ...acc.vendor,
          phone_number: acc.phone,
          is_active: true,
          is_demo: true,
          image_urls: [],
        });
      }

      results.push({ phone: acc.phone, status: "created", user_id: userId });
    } catch (err) {
      results.push({ phone: acc.phone, status: "error", error: String(err) });
    }
  }

  return new Response(
    JSON.stringify({ success: true, results, password: PASSWORD, otp: "123456" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
