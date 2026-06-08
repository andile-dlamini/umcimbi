import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'https://esm.sh/zod@3.23.8';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const BodySchema = z.object({
  token: z.string().min(16).max(256),
  photo_base64: z.string().min(100),
  mime_type: z.string().refine((m) => ALLOWED_MIME.has(m), {
    message: 'mime_type must be image/jpeg, image/png, or image/webp',
  }),
});

function extFromMime(m: string): string {
  if (m === 'image/jpeg') return 'jpg';
  if (m === 'image/png') return 'png';
  if (m === 'image/webp') return 'webp';
  return 'bin';
}

function decodeBase64(b64: string): Uint8Array {
  const stripped = b64.replace(/^data:[^;]+;base64,/, '');
  const bin = atob(stripped);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { token, photo_base64, mime_type } = parsed.data;

    const bytes = decodeBase64(photo_base64);
    if (bytes.length === 0 || bytes.length > MAX_BYTES) {
      return new Response(JSON.stringify({ error: 'Invalid photo size' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: vendor, error: vErr } = await admin
      .from('vendors')
      .select('id')
      .eq('selfie_request_token', token)
      .maybeSingle();

    if (vErr || !vendor) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const path = `${vendor.id}/selfie-${Date.now()}.${extFromMime(mime_type)}`;
    const { error: upErr } = await admin.storage
      .from('vendor-selfies')
      .upload(path, bytes, { contentType: mime_type, upsert: false });

    if (upErr) {
      console.error('Upload failed:', upErr);
      return new Response(JSON.stringify({ error: 'Upload failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: updErr } = await admin
      .from('vendors')
      .update({ selfie_photo_url: path, selfie_request_token: null })
      .eq('id', vendor.id);

    if (updErr) {
      console.error('Vendor update failed:', updErr);
      return new Response(JSON.stringify({ error: 'Update failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('vendor-selfie-submission error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
