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

  const TARGET_ID = "2f8b82a5-e9c9-4388-84c0-bab1b0cbc791";
  const PHONE = "+27710000005";
  const EMAIL = "27710000005@phone.isiko.app";
  const PASSWORD = "Demo123!";

  try {
    // Check if auth user already exists
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list.users.find(
      (u) => u.id === TARGET_ID || u.email === EMAIL || u.phone === PHONE.replace("+", "")
    );

    if (existing) {
      // Make sure password & confirmation are set
      await supabase.auth.admin.updateUserById(existing.id, {
        password: PASSWORD,
        email_confirm: true,
        phone_confirm: true,
      });
      return new Response(
        JSON.stringify({ ok: true, action: "updated", user_id: existing.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save existing profile + roles, delete them so the handle_new_user trigger can insert cleanly
    const { data: existingProfile } = await supabase
      .from("profiles").select("*").eq("user_id", TARGET_ID).maybeSingle();
    const { data: existingRoles } = await supabase
      .from("user_roles").select("role").eq("user_id", TARGET_ID);

    await supabase.from("user_roles").delete().eq("user_id", TARGET_ID);
    await supabase.from("profiles").delete().eq("user_id", TARGET_ID);

    // Create auth user with the SAME id so vendor/booking FKs still resolve
    const { data: created, error } = await supabase.auth.admin.createUser({
      id: TARGET_ID,
      email: EMAIL,
      password: PASSWORD,
      phone: PHONE,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        first_name: "Sipho",
        surname: "Dlamini",
        full_name: "Sipho Dlamini",
      },
    } as any);

    if (error) throw error;

    // Restore profile fields
    if (existingProfile) {
      await supabase.from("profiles").update({
        first_name: existingProfile.first_name ?? "Sipho",
        surname: existingProfile.surname ?? "Dlamini",
        full_name: existingProfile.full_name ?? "Sipho Dlamini",
        phone_number: PHONE,
        phone_verified: true,
        is_profile_complete: true,
        is_demo: true,
        email: EMAIL,
      }).eq("user_id", TARGET_ID);
    }

    // Restore roles
    const roles = new Set((existingRoles ?? []).map((r: any) => r.role));
    roles.add("vendor");
    for (const role of roles) {
      await supabase.from("user_roles")
        .insert({ user_id: TARGET_ID, role })
        .then(() => {}, () => {});
    }

    return new Response(
      JSON.stringify({ ok: true, action: "created", user_id: created.user?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String((e as Error).message ?? e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
