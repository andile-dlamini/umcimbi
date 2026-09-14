import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'https://esm.sh/zod@3.23.8';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CONNECT_MOBILE_API_KEY = Deno.env.get('CONNECT_MOBILE_API_KEY')!;

const BodySchema = z.object({
  dry_run: z.boolean().optional().default(true),
  campaign: z.enum(['vendor_recovery', 'service_areas']).optional().default('vendor_recovery'),
});

function buildVendorRecoveryMessage(firstName: string): string {
  return `Hi ${firstName}. This is Andile Dlamini from UMCIMBI. Thanks for signing up as a vendor, but we noticed you haven't finished your business profile so that your business can be online. Please complete your profile by following this link: umcimbi.co.za/complete-profile?ref=vendor-recovery`;
}

function buildServiceAreasMessage(firstName: string): string {
  return `Hi ${firstName}. This is Andile Dlamini from UMCIMBI. In response to the feedback from the families planning their ceremonies, we have added service areas to your profile, so families searching in your area can find your business. Please add the areas you serve here: umcimbi.co.za/update-service-areas?ref=service-areas`;
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

interface Recipient {
  user_id: string;
  vendor_id?: string;
  first_name: string;
  phone_number: string;
  message: string;
}

interface SkippedVendor {
  vendor_id: string;
  name: string;
  reason: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!(await isAuthorized(req))) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let rawBody: unknown = {};
    try {
      rawBody = await req.json();
    } catch {
      rawBody = {};
    }
    const parsed = BodySchema.safeParse(rawBody ?? {});
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const dryRun = parsed.data.dry_run !== false;
    const campaign = parsed.data.campaign;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    if (campaign === 'vendor_recovery') {
      // Vendor-role users
      const { data: vendorRoles, error: rolesErr } = await admin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'vendor');
      if (rolesErr) throw rolesErr;
      const vendorUserIds = [...new Set((vendorRoles ?? []).map((r) => r.user_id))];

      if (vendorUserIds.length === 0) {
        return new Response(JSON.stringify({ dry_run: dryRun, count: 0, recipients: [] }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: profiles, error: profErr } = await admin
        .from('profiles')
        .select('user_id, first_name, phone_number')
        .in('user_id', vendorUserIds)
        .eq('is_demo', false)
        .eq('phone_verified', true)
        .not('phone_number', 'is', null);
      if (profErr) throw profErr;

      const candidateIds = (profiles ?? []).map((p) => p.user_id);
      if (candidateIds.length === 0) {
        return new Response(JSON.stringify({ dry_run: dryRun, count: 0, recipients: [] }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: existingVendors, error: vErr } = await admin
        .from('vendors')
        .select('owner_user_id')
        .in('owner_user_id', candidateIds);
      if (vErr) throw vErr;
      const hasVendor = new Set((existingVendors ?? []).map((v) => v.owner_user_id));

      const { data: alreadySent, error: logErr } = await admin
        .from('vendor_sms_log')
        .select('user_id')
        .eq('campaign', campaign)
        .in('user_id', candidateIds);
      if (logErr) throw logErr;
      const contacted = new Set((alreadySent ?? []).map((l) => l.user_id));

      const recipients = (profiles ?? [])
        .filter((p) => !hasVendor.has(p.user_id) && !contacted.has(p.user_id))
        .map((p) => {
          const firstName = p.first_name?.trim() || 'there';
          return {
            user_id: p.user_id,
            first_name: firstName,
            phone_number: p.phone_number as string,
            message: buildVendorRecoveryMessage(firstName),
          };
        });

      if (dryRun) {
        return new Response(
          JSON.stringify({ dry_run: true, count: recipients.length, recipients }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let sent = 0;
      let failed = 0;
      const results: Array<{
        user_id: string;
        phone_number: string;
        status: string;
        provider_response: string;
      }> = [];

      for (const r of recipients) {
        let status = 'failed';
        let providerResponse = '';
        try {
          const phone = normalizePhone(r.phone_number);
          const url = `https://sms.connect-mobile.co.za/submit/single/?da=${encodeURIComponent(phone)}&ud=${encodeURIComponent(r.message)}&id=${crypto.randomUUID()}`;
          const smsRes = await fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${CONNECT_MOBILE_API_KEY}` },
          });
          providerResponse = await smsRes.text();
          if (smsRes.ok) {
            status = 'sent';
            sent++;
          } else {
            failed++;
            console.error('SMS provider error:', r.user_id, smsRes.status, providerResponse);
          }
        } catch (e) {
          failed++;
          providerResponse = (e as Error).message;
          console.error('SMS send failed:', r.user_id, providerResponse);
        }

        const { error: insErr } = await admin.from('vendor_sms_log').insert({
          user_id: r.user_id,
          campaign,
          status,
          provider_response: providerResponse.slice(0, 2000),
        });
        if (insErr) console.error('vendor_sms_log insert failed:', r.user_id, insErr.message);

        results.push({
          user_id: r.user_id,
          phone_number: r.phone_number,
          status,
          provider_response: providerResponse.slice(0, 500),
        });
      }

      return new Response(
        JSON.stringify({ dry_run: false, attempted: recipients.length, sent, failed, results }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // campaign === 'service_areas'
    const { data: vendors, error: vendorsErr } = await admin
      .from('vendors')
      .select('id, name, owner_user_id, phone_number')
      .eq('is_demo', false)
      .eq('is_banned', false)
      .eq('is_active', true);
    if (vendorsErr) throw vendorsErr;

    const vendorIds = (vendors ?? []).map((v) => v.id);
    const ownerIds = [...new Set((vendors ?? []).map((v) => v.owner_user_id).filter(Boolean))] as string[];

    const [{ data: serviceRegionRows, error: srErr }, { data: alreadySent, error: logErr }] = await Promise.all([
      admin.from('vendor_service_regions').select('vendor_id').in('vendor_id', vendorIds.length ? vendorIds : ['00000000-0000-0000-0000-000000000000']),
      admin.from('vendor_sms_log').select('user_id').eq('campaign', campaign).in('user_id', ownerIds.length ? ownerIds : ['00000000-0000-0000-0000-000000000000']),
    ]);
    if (srErr) throw srErr;
    if (logErr) throw logErr;

    const hasServiceRegions = new Set((serviceRegionRows ?? []).map((r) => r.vendor_id));
    const contacted = new Set((alreadySent ?? []).map((l) => l.user_id));

    const { data: profiles, error: profErr } = await admin
      .from('profiles')
      .select('user_id, first_name, phone_number')
      .in('user_id', ownerIds.length ? ownerIds : ['00000000-0000-0000-0000-000000000000']);
    if (profErr) throw profErr;
    const profileByUserId = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    const recipients: Recipient[] = [];
    const skipped: SkippedVendor[] = [];

    for (const v of vendors ?? []) {
      if (!v.owner_user_id) {
        skipped.push({ vendor_id: v.id, name: v.name || '', reason: 'missing owner_user_id' });
        continue;
      }
      if (hasServiceRegions.has(v.id)) {
        skipped.push({ vendor_id: v.id, name: v.name || '', reason: 'has service regions' });
        continue;
      }
      if (contacted.has(v.owner_user_id)) {
        skipped.push({ vendor_id: v.id, name: v.name || '', reason: 'already contacted' });
        continue;
      }

      const phone = v.phone_number?.trim() || profileByUserId.get(v.owner_user_id)?.phone_number?.trim();
      if (!phone) {
        skipped.push({ vendor_id: v.id, name: v.name || '', reason: 'no phone number' });
        continue;
      }

      const firstName = profileByUserId.get(v.owner_user_id)?.first_name?.trim() || v.name?.trim() || 'there';
      recipients.push({
        user_id: v.owner_user_id,
        vendor_id: v.id,
        first_name: firstName,
        phone_number: phone,
        message: buildServiceAreasMessage(firstName),
      });
    }

    if (dryRun) {
      return new Response(
        JSON.stringify({ dry_run: true, count: recipients.length, recipients, skipped }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sent = 0;
    let failed = 0;
    const results: Array<{
      user_id: string;
      vendor_id?: string;
      phone_number: string;
      status: string;
      provider_response: string;
    }> = [];

    for (const r of recipients) {
      let status = 'failed';
      let providerResponse = '';
      try {
        const phone = normalizePhone(r.phone_number);
        const url = `https://sms.connect-mobile.co.za/submit/single/?da=${encodeURIComponent(phone)}&ud=${encodeURIComponent(r.message)}&id=${crypto.randomUUID()}`;
        const smsRes = await fetch(url, {
          method: 'GET',
          headers: { Authorization: `Bearer ${CONNECT_MOBILE_API_KEY}` },
        });
        providerResponse = await smsRes.text();
        if (smsRes.ok) {
          status = 'sent';
          sent++;
        } else {
          failed++;
          console.error('SMS provider error:', r.user_id, smsRes.status, providerResponse);
        }
      } catch (e) {
        failed++;
        providerResponse = (e as Error).message;
        console.error('SMS send failed:', r.user_id, providerResponse);
      }

      const { error: insErr } = await admin.from('vendor_sms_log').insert({
        user_id: r.user_id,
        campaign,
        status,
        provider_response: providerResponse.slice(0, 2000),
      });
      if (insErr) console.error('vendor_sms_log insert failed:', r.user_id, insErr.message);

      results.push({
        user_id: r.user_id,
        vendor_id: r.vendor_id,
        phone_number: r.phone_number,
        status,
        provider_response: providerResponse.slice(0, 500),
      });
    }

    return new Response(
      JSON.stringify({ dry_run: false, attempted: recipients.length, sent, failed, results, skipped }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('send-vendor-recovery-sms error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
