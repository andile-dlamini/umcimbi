import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Whitelist of demo vendor phones that can be toggled
const ALLOWED_PHONES = [
  "+27820000901",
  "+27710000002",
  "+27710000003",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const expectedAuth = `Bearer ${serviceKey}`;
  if (req.headers.get("authorization") !== expectedAuth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { phone, active } = await req.json();
    if (!phone || typeof active !== "boolean") {
      return new Response(
        JSON.stringify({ error: "Provide { phone, active: boolean }" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let normalized = String(phone).replace(/\s/g, "");
    if (normalized.startsWith("0")) normalized = "+27" + normalized.slice(1);
    if (!normalized.startsWith("+")) normalized = "+" + normalized;

    if (!ALLOWED_PHONES.includes(normalized)) {
      return new Response(
        JSON.stringify({ error: "Phone not in demo whitelist" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: list } = await supabase.auth.admin.listUsers();
    const user = list.users.find((u) => u.phone === normalized.replace("+", ""));
    if (!user) {
      return new Response(JSON.stringify({ error: "Demo user not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: updated, error } = await supabase
      .from("vendors")
      .update({ is_active: active })
      .eq("owner_user_id", user.id)
      .select("id, name, is_active");

    if (error) throw error;

    return new Response(
      JSON.stringify({ ok: true, vendors: updated }, null, 2),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: String(error?.message ?? error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
