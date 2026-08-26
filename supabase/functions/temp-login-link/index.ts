// TEMPORARY one-off admin utility: generate a magic sign-in link for a user.
// Delete after use.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { email, redirect_to } = await req.json();
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: redirect_to },
    });
    if (error) throw error;
    return new Response(JSON.stringify({ link: data.properties?.action_link }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
