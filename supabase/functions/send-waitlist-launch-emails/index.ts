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

  // Fetch target signups
  let query = admin
    .from('waitlist_signups')
    .select('id, full_name, email')
    .not('email', 'is', null)
    .is('launch_email_sent_at', null)

  if (signupId) {
    query = admin
      .from('waitlist_signups')
      .select('id, full_name, email')
      .eq('id', signupId)
      .not('email', 'is', null)
  }

  const { data: signups, error: fetchErr } = await query
  if (fetchErr) {
    return new Response(JSON.stringify({ error: fetchErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!signups || signups.length === 0) {
    return new Response(JSON.stringify({ sent: 0, skipped: 0, failed: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let sent = 0
  let failed = 0
  const errors: Array<{ id: string; error: string }> = []

  for (const s of signups) {
    if (!s.email) continue
    try {
      const firstName = (s.full_name || '').trim().split(/\s+/)[0] || undefined

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
          }),
        }
      )

      if (!res.ok) {
        const text = await res.text()
        failed++
        errors.push({ id: s.id, error: `${res.status}: ${text.slice(0, 200)}` })
        continue
      }

      await admin
        .from('waitlist_signups')
        .update({ launch_email_sent_at: new Date().toISOString() })
        .eq('id', s.id)

      sent++
    } catch (e) {
      failed++
      errors.push({ id: s.id, error: (e as Error).message })
    }
  }

  return new Response(
    JSON.stringify({ sent, failed, total: signups.length, errors: errors.slice(0, 10) }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
