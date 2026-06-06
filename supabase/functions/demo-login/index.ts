import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_PHONES = ["+27820000901", "+27820000902", "+27820000903", "+27820000904", "+27710000002", "+27710000003", "+27710000004"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { phone_number, password } = await req.json();
    if (!phone_number || !password) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let normalized = String(phone_number).replace(/\s/g, "");
    if (normalized.startsWith("0")) normalized = "+27" + normalized.slice(1);
    if (!normalized.startsWith("+")) normalized = "+" + normalized;

    if (!DEMO_PHONES.includes(normalized)) {
      return new Response(JSON.stringify({ error: "Not a demo account" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const email = `${normalized.replace("+", "")}@phone.isiko.app`;
    const { data: list } = await supabase.auth.admin.listUsers();
    const user = list.users.find(
      (u) => u.email === email || u.phone === normalized.replace("+", "")
    );

    if (!user) {
      return new Response(JSON.stringify({ error: "Demo user not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase.auth.admin.updateUserById(user.id, { password });
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
