import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { normalizeSaPhone, sendConnectMobileSms } from '../_shared/smsTemplates.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function buildMessage(name: string, type: '24h' | '72h'): string {
  if (type === '24h') {
    return `Hi ${name}, you started registering as a vendor on UMCIMBI but haven't finished your business profile yet. It only takes a few minutes, complete it here so families can start finding you: umcimbi.co.za/vendors/onboarding. Kind regards, Andile`;
  }
  return `Hi ${name}, your UMCIMBI vendor profile is still incomplete. Families in your area are already browsing for vendors like you. Finish your profile now to start getting bookings: umcimbi.co.za/vendors/onboarding. Kind regards, Andile`;
}

Deno.serve(async (_req) => {
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: vendorRoles, error: rolesErr } = await admin
      .from('user_roles').select('user_id').eq('role', 'vendor');
    if (rolesErr) throw rolesErr;
    const vendorRoleUserIds = (vendorRoles ?? []).map((r) => r.user_id);
    if (vendorRoleUserIds.length === 0) {
      return new Response(JSON.stringify({ success: true, sent24: 0, sent72: 0 }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: existingVendors, error: vendorsErr } = await admin
      .from('vendors').select('owner_user_id').in('owner_user_id', vendorRoleUserIds);
    if (vendorsErr) throw vendorsErr;
    const alreadyHaveProfile = new Set((existingVendors ?? []).map((v) => v.owner_user_id));

    const candidateIds = vendorRoleUserIds.filter((id) => !alreadyHaveProfile.has(id));
    if (candidateIds.length === 0) {
      return new Response(JSON.stringify({ success: true, sent24: 0, sent72: 0 }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: profiles, error: profilesErr } = await admin
      .from('profiles')
      .select('user_id, first_name, phone_number, created_at')
      .in('user_id', candidateIds);
    if (profilesErr) throw profilesErr;

    const now = Date.now();
    let sent24 = 0, sent72 = 0;

    for (const p of profiles ?? []) {
      if (!p.phone_number || !p.created_at) continue;
      const hoursSince = (now - new Date(p.created_at).getTime()) / (1000 * 60 * 60);
      const type: '24h' | '72h' | null = hoursSince >= 72 ? '72h' : hoursSince >= 24 ? '24h' : null;
      if (!type) continue;

      const { data: prefs } = await admin
        .from('notification_preferences').select('sms_enabled').eq('user_id', p.user_id).maybeSingle();
      if (prefs?.sms_enabled === false) continue;

      // Insert-first acts as the duplicate lock: a unique violation means already sent.
      const { error: lockErr } = await admin
        .from('vendor_registration_reminders')
        .insert({ user_id: p.user_id, reminder_type: type });
      if (lockErr) continue;

      const phoneNoPlus = normalizeSaPhone(p.phone_number);
      if (!phoneNoPlus) continue;

      const message = buildMessage(p.first_name ?? 'there', type);
      const result = await sendConnectMobileSms(phoneNoPlus, message, crypto.randomUUID());

      await admin.from('sms_notification_log').insert({
        user_id: p.user_id,
        user_type: 'vendor',
        event_type: `vendor_registration_reminder_${type}`,
        tier: result.ok ? 'tier1' : 'suppressed',
        phone_number: p.phone_number,
        provider_response: result.response,
      });

      if (result.ok) { if (type === '24h') sent24++; else sent72++; }
    }

    return new Response(JSON.stringify({ success: true, sent24, sent72 }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
});
