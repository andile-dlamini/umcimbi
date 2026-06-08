import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'https://esm.sh/zod@3.23.8';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CONNECT_MOBILE_API_KEY = Deno.env.get('CONNECT_MOBILE_API_KEY')!;

const BodySchema = z.object({
  vendor_id: z.string().uuid(),
  sms_type: z.enum([
    'registration',
    'approved',
    'request_info',
    'request_selfie',
    'selfie_link',
    'rejected',
    'banned',
  ]),
  notes: z.string().max(500).optional(),
});

function buildMessage(name: string, type: string, notes?: string): string {
  switch (type) {
    case 'registration':
      return `Hi ${name}, thank you for registering on UMCIMBI. We are reviewing your application and will be in touch with next steps within 48 hours.  Kind regards, Andile`;
    case 'approved':
      return `Hi ${name}, great news! Your UMCIMBI vendor profile has been approved and is now live. Families planning ceremonies can find and contact you. Kind regards, Andile`;
    case 'request_info':
      return `Hi ${name}, we are reviewing your UMCIMBI application. We need a bit more from you before we can activate your profile: ${notes ?? ''}. Kind regards, Andile`;
    case 'request_selfie':
      return `Hi ${name}, as part of verifying your UMCIMBI vendor profile, please submit a photo of yourself holding your ID document. You will receive a link shortly. Kind regards, Andile`;
    case 'selfie_link':
      return `Hi ${name}, please submit your identity selfie here to complete your UMCIMBI vendor verification: ${notes ?? ''} Kind regards, Andile`;
    case 'rejected':
      return `Hi ${name}, unfortunately we are unable to activate your UMCIMBI vendor profile at this time. ${notes ? notes + ' ' : ''}Please log in to update and resubmit your profile. Kind regards, Andile`;
    case 'banned':
      return `Hi ${name}, your UMCIMBI vendor application was unsuccessful. Kind regards, Andile`;
    default:
      return '';
  }
}

function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '27' + digits.slice(1);
  return digits;
}

async function isAuthorized(req: Request): Promise<boolean> {
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
    if (!(await isAuthorized(req))) {
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
    const { vendor_id, sms_type, notes } = parsed.data;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: vendor, error: vErr } = await admin
      .from('vendors')
      .select('name, phone_number')
      .eq('id', vendor_id)
      .maybeSingle();

    if (vErr || !vendor) {
      return new Response(JSON.stringify({ error: 'Vendor not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!vendor.phone_number) {
      return new Response(JSON.stringify({ error: 'Vendor has no phone number' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const message = buildMessage(vendor.name ?? 'there', sms_type, notes);
    const phone = normalizePhone(vendor.phone_number);
    const url = `https://sms.connect-mobile.co.za/submit/single/?da=${encodeURIComponent(phone)}&ud=${encodeURIComponent(message)}&id=${crypto.randomUUID()}`;

    const smsRes = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${CONNECT_MOBILE_API_KEY}` },
    });
    const smsBody = await smsRes.text();

    if (!smsRes.ok) {
      console.error('SMS provider error:', smsRes.status, smsBody);
      return new Response(
        JSON.stringify({ error: 'SMS provider error', status: smsRes.status, body: smsBody }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: true, sms_type, provider: smsBody }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('send-vendor-status-sms error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
