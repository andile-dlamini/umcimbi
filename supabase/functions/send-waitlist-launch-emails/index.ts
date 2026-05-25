import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Admin-only function: sends the launch announcement email to waitlist signups
// who have not yet been notified. Marks launch_email_sent_at on success.
//
// Body:
//   { signupId?: string }  // if omitted, sends to all signups where
//                          // launch_email_sent_at IS NULL AND email IS NOT NULL
//
// Auth: requires a logged-in user with the 'admin' role.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Verify caller is admin
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(supabaseUrl, serviceKey)
  const { data: roleRow } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (!roleRow) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let signupId: string | undefined
  try {
    const body = await req.json().catch(() => ({}))
    signupId = body?.signupId
  } catch { /* ignore */ }

  // Fetch target signups: needs notifying (no email-sent AND no sms-sent)
  // and has either an email or a phone number.
  let query = admin
    .from('waitlist_signups')
    .select('id, full_name, email, phone_number, launch_email_sent_at, launch_sms_sent_at')

  if (signupId) {
    query = query.eq('id', signupId)
  } else {
    query = query
      .is('launch_email_sent_at', null)
      .is('launch_sms_sent_at', null)
      .or('email.not.is.null,phone_number.not.is.null')
  }

  const { data: signups, error: fetchErr } = await query
  if (fetchErr) {
    return new Response(JSON.stringify({ error: fetchErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!signups || signups.length === 0) {
    return new Response(JSON.stringify({ emailSent: 0, smsSent: 0, failed: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const connectMobileKey = Deno.env.get('CONNECT_MOBILE_API_KEY')
  const SITE_URL = 'https://umcimbi.co.za'
  const SMS_BODY = `UMCIMBI is live! Your spot is ready. Sign in to start planning or claim your vendor profile: ${SITE_URL} — Andile`

  let emailSent = 0
  let smsSent = 0
  let failed = 0
  const errors: Array<{ id: string; channel: string; error: string }> = []

  for (const s of signups) {
    const firstName = (s.full_name || '').trim().split(/\s+/)[0] || undefined
    const hasEmail = !!s.email && !s.launch_email_sent_at
    const hasPhone = !!s.phone_number && !s.launch_sms_sent_at

    // Prefer email; fall back to SMS only if no email exists.
    if (hasEmail) {
      try {
        const res = await fetch(
          `${supabaseUrl}/functions/v1/send-transactional-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${serviceKey}`,
              apikey: serviceKey,
            },
            body: JSON.stringify({
              templateName: 'launch-announcement',
              recipientEmail: s.email,
              idempotencyKey: `waitlist-launch-${s.id}`,
              templateData: { name: firstName },
              from: 'Andile from UMCIMBI <andile@umcimbi.co.za>',
            }),
          }
        )

        if (!res.ok) {
          const text = await res.text()
          failed++
          errors.push({ id: s.id, channel: 'email', error: `${res.status}: ${text.slice(0, 200)}` })
          console.error('Launch email failed', { id: s.id, status: res.status, response: text.slice(0, 500) })
          continue
        }

        await admin
          .from('waitlist_signups')
          .update({ launch_email_sent_at: new Date().toISOString() })
          .eq('id', s.id)
        emailSent++
      } catch (e) {
        failed++
        errors.push({ id: s.id, channel: 'email', error: (e as Error).message })
      }
    } else if (hasPhone) {
      if (!connectMobileKey) {
        failed++
        errors.push({ id: s.id, channel: 'sms', error: 'CONNECT_MOBILE_API_KEY not configured' })
        continue
      }
      try {
        // Normalize SA phone: strip leading +, convert leading 0 to 27
        let smsPhone = String(s.phone_number).replace(/[^\d+]/g, '').replace(/^\+/, '')
        if (smsPhone.startsWith('0')) smsPhone = '27' + smsPhone.slice(1)
        if (!/^27\d{9}$/.test(smsPhone)) {
          failed++
          errors.push({ id: s.id, channel: 'sms', error: `Invalid SA number: ${s.phone_number}` })
          continue
        }
        const msgId = `launch_${s.id.slice(0, 8)}_${Date.now()}`
        const smsUrl = `https://sms.connect-mobile.co.za/submit/single/?da=${smsPhone}&ud=${encodeURIComponent(SMS_BODY)}&id=${msgId}`
        const smsRes = await fetch(smsUrl, {
          method: 'GET',
          headers: { Authorization: `Bearer ${connectMobileKey}` },
        })
        const smsBody = (await smsRes.text()).slice(0, 300)
        if (!smsRes.ok || /(error|invalid|failed|denied|unauthorized)/i.test(smsBody)) {
          failed++
          errors.push({ id: s.id, channel: 'sms', error: `${smsRes.status}: ${smsBody}` })
          continue
        }
        await admin
          .from('waitlist_signups')
          .update({ launch_sms_sent_at: new Date().toISOString() })
          .eq('id', s.id)
        smsSent++
      } catch (e) {
        failed++
        errors.push({ id: s.id, channel: 'sms', error: (e as Error).message })
      }
    }
  }

  return new Response(
    JSON.stringify({ emailSent, smsSent, failed, total: signups.length, errors: errors.slice(0, 10) }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
