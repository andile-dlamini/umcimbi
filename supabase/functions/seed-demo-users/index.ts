import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const password = "DemoUmcimbi2026!";
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
    // Delete if exists (by email)
    const { data: existing } = await supabase.auth.admin.listUsers();
    const match = existing.users.find((u) => u.email === acc.email);
    if (match) {
      await supabase.auth.admin.deleteUser(match.id);
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
        email: acc.email,
      })
      .eq("user_id", created.user.id);

    if (acc.role === "vendor") {
      await supabase
        .from("user_roles")
        .insert({ user_id: created.user.id, role: "vendor" });
    }

    results.push({ email: acc.email, user_id: created.user.id, ok: true });
  }

  return new Response(JSON.stringify({ password, results }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
