import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'https://esm.sh/zod@3.23.8';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const BodySchema = z.object({
  vendor_id: z.string().uuid(),
});

// verify_jwt = false in config.toml: this function authenticates internally
// (service-role bearer, or a signed-in user who holds the admin role).
async function isAdmin(req: Request): Promise<boolean> {
  const auth = req.headers.get('Authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;
  if (token === SERVICE_ROLE) return true;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return false;
  const { data: roles } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .eq('role', 'admin')
    .maybeSingle();
  return !!roles;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!(await isAdmin(req))) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { vendor_id } = parsed.data;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: vendor, error: vErr } = await admin
      .from('vendors')
      .select('id')
      .eq('id', vendor_id)
      .maybeSingle();
    if (vErr || !vendor) {
      return new Response(JSON.stringify({ error: 'Vendor not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // A new link invalidates any previous outstanding link.
    const { error: consumeErr } = await admin
      .from('vendor_selfie_requests')
      .update({ consumed_at: new Date().toISOString() })
      .eq('vendor_id', vendor_id)
      .is('consumed_at', null);
    if (consumeErr) {
      console.error('Failed to invalidate previous selfie requests:', consumeErr);
      return new Response(JSON.stringify({ error: 'Failed to create selfie request' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: insErr } = await admin
      .from('vendor_selfie_requests')
      .insert({ vendor_id, token, expires_at: expiresAt });
    if (insErr) {
      console.error('Failed to insert selfie request:', insErr);
      return new Response(JSON.stringify({ error: 'Failed to create selfie request' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ token, expires_at: expiresAt }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('create-vendor-selfie-request error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
