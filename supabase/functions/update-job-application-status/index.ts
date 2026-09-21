import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Admin-only function: updates a job_applications row's status, and when the
// new status is 'declined', sends the decline email via send-transactional-email.
// Body: { id: string, status: 'received' | 'shortlisted' | 'declined' | 'hired' }

const VALID_STATUSES = ['received', 'shortlisted', 'declined', 'hired']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData?.user) return json({ error: 'Unauthorized' }, 401)

  const admin = createClient(supabaseUrl, serviceKey)

  const { data: roleRow } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (!roleRow) return json({ error: 'Forbidden' }, 403)

  try {
    const { id, status } = await req.json()

    if (!id || typeof id !== 'string' || !VALID_STATUSES.includes(status)) {
      return json({ error: 'Invalid id or status' }, 400)
    }

    const { data: application, error: fetchError } = await admin
      .from('job_applications')
      .select('id, name, email, status')
      .eq('id', id)
      .single()

    if (fetchError || !application) return json({ error: 'Application not found' }, 404)

    const wasAlreadyDeclined = application.status === 'declined'

    const { error: updateError } = await admin
      .from('job_applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) {
      console.error('job_applications status update failed', updateError)
      return json({ error: 'Could not update status' }, 500)
    }

    if (status === 'declined' && !wasAlreadyDeclined) {
      try {
        const { error: emailError } = await admin.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'job-application-declined',
            recipientEmail: application.email,
            idempotencyKey: `job-application-declined-${application.id}`,
            templateData: { name: application.name },
          },
          headers: { Authorization: `Bearer ${serviceKey}` },
        })
        if (emailError) {
          console.error('decline email failed for application', application.id, emailError)
        }
      } catch (emailErr) {
        console.error('decline email threw for application', application.id, emailErr)
      }
    }

    return json({ ok: true }, 200)
  } catch (err) {
    console.error('update-job-application-status error', err)
    return json({ error: 'Unexpected error' }, 500)
  }
})
