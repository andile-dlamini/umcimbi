// Sends a one-time welcome message (SMS and/or email) to a newly created vendor.
// Triggered from the signup flows right after the vendors row is created.
// Idempotent: guarded by the unique (user_id, campaign) index on vendor_sms_log.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'https://esm.sh/zod@3.23.8';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CONNECT_MOBILE_API_KEY = Deno.env.get('CONNECT_MOBILE_API_KEY')!;

const CAMPAIGN = 'vendor_welcome';
const WHATSAPP_URL = 'https://chat.whatsapp.com/DNgVHc9z8bn4g2PlbMi8T1?mode=gi_t';

const BodySchema = z.object({
  vendor_id: z.string().uuid(),
});

function buildWelcomeSms(firstName: string): string {
  return `Sawubona ${firstName}. Welcome to UMCIMBI! We are excited to have your business on board. I have also started an optional UMCIMBI Vendor Community WhatsApp group, where vendors learn from each other, ask questions, give feedback and celebrate successes. Joining is optional and other members can see your number. To join: ${WHATSAPP_URL}

Kind regards
Andile`;
}

function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '27' + digits.slice(1);
  return digits;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const auth = req.headers.get('Authorization') || '';
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    if (!token) return json({ error: 'Unauthorized' }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    let callerId: string | null = null;
    if (token !== SERVICE_ROLE) {
      const { data, error } = await admin.auth.getUser(token);
      if (error || !data.user) return json({ error: 'Unauthorized' }, 401);
      callerId = data.user.id;
    }

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return json({ error: parsed.error.flatten().fieldErrors }, 400);
    }
    const { vendor_id } = parsed.data;

    const { data: vendor, error: vErr } = await admin
      .from('vendors')
      .select('id, name, owner_user_id, phone_number, email, is_demo')
      .eq('id', vendor_id)
      .maybeSingle();

    if (vErr || !vendor) return json({ error: 'Vendor not found' }, 404);

    // Only the vendor owner (or an internal service call) may trigger this.
    if (callerId && vendor.owner_user_id !== callerId) {
      return json({ error: 'Forbidden' }, 403);
    }

    if (!vendor.owner_user_id) return json({ skipped: 'no_owner' }, 200);
    if (vendor.is_demo) return json({ skipped: 'demo_vendor' }, 200);

    const { data: profile } = await admin
      .from('profiles')
      .select('first_name, full_name, phone_number, email, is_demo')
      .eq('user_id', vendor.owner_user_id)
      .maybeSingle();

    if (profile?.is_demo) return json({ skipped: 'demo_account' }, 200);

    // Idempotency guard: the unique (user_id, campaign) index means the insert
    // fails if this vendor's owner was already welcomed.
    const { error: claimErr } = await admin.from('vendor_sms_log').insert({
      user_id: vendor.owner_user_id,
      campaign: CAMPAIGN,
      status: 'pending',
      provider_response: '',
    });
    if (claimErr) {
      console.log('vendor welcome already sent or claim failed:', vendor_id, claimErr.message);
      return json({ skipped: 'already_sent' }, 200);
    }

    const firstName =
      profile?.first_name?.trim() ||
      profile?.full_name?.trim().split(/\s+/)[0] ||
      vendor.name?.trim() ||
      'there';

    const phone = vendor.phone_number?.trim() || profile?.phone_number?.trim() || null;
    const email = vendor.email?.trim() || profile?.email?.trim() || null;

    let smsStatus = 'skipped';
    let providerResponse = '';
    if (phone) {
      try {
        const url = `https://sms.connect-mobile.co.za/submit/single/?da=${encodeURIComponent(
          normalizePhone(phone)
        )}&ud=${encodeURIComponent(buildWelcomeSms(firstName))}&id=${crypto.randomUUID()}`;
        const smsRes = await fetch(url, {
          method: 'GET',
          headers: { Authorization: `Bearer ${CONNECT_MOBILE_API_KEY}` },
        });
        providerResponse = await smsRes.text();
        smsStatus = smsRes.ok ? 'sent' : 'failed';
        if (!smsRes.ok) console.error('Welcome SMS provider error:', vendor_id, providerResponse);
      } catch (e) {
        smsStatus = 'failed';
        providerResponse = (e as Error).message;
        console.error('Welcome SMS send failed:', vendor_id, providerResponse);
      }
    }

    let emailStatus = 'skipped';
    if (email && !email.endsWith('@phone.isiko.app')) {
      try {
        const { error: emailError } = await admin.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'vendor-welcome',
            recipientEmail: email,
            idempotencyKey: `vendor-welcome-${vendor_id}`,
            templateData: { name: firstName, businessName: vendor.name },
          },
          headers: { Authorization: `Bearer ${SERVICE_ROLE}` },
        });
        emailStatus = emailError ? 'failed' : 'sent';
        if (emailError) console.error('Welcome email failed:', vendor_id, emailError);
      } catch (e) {
        emailStatus = 'failed';
        console.error('Welcome email threw:', vendor_id, (e as Error).message);
      }
    }

    await admin
      .from('vendor_sms_log')
      .update({
        status: smsStatus === 'sent' || emailStatus === 'sent' ? 'sent' : smsStatus,
        provider_response: `sms=${smsStatus}; email=${emailStatus}; ${providerResponse}`.slice(
          0,
          2000
        ),
      })
      .eq('user_id', vendor.owner_user_id)
      .eq('campaign', CAMPAIGN);

    return json({ ok: true, sms: smsStatus, email: emailStatus }, 200);
  } catch (e) {
    console.error('send-vendor-welcome error:', (e as Error).message);
    return json({ error: 'Unexpected error' }, 500);
  }
});
