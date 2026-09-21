import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

// Public function: called from the Careers page application form.
// No auth required (applicants aren't logged in). Inserts the application
// with the service role (bypassing RLS, since only service_role can INSERT
// per the job_applications policy) and sends an acknowledgment email via
// the existing send-transactional-email function.
//
// Body: { role_slug: string, name: string, email: string, story: string, socials?: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return json({ error: 'Invalid request body' }, 400)
    }

    const role_slug = typeof body.role_slug === 'string' ? body.role_slug.trim() : ''
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const story = typeof body.story === 'string' ? body.story.trim() : ''
    const socials = typeof body.socials === 'string' ? body.socials.trim() : null

    if (!role_slug || !name || !email || !story) {
      return json({ error: 'Missing required fields' }, 400)
    }
    if (!EMAIL_RE.test(email) || email.length > 255) {
      return json({ error: 'Invalid email address' }, 400)
    }
    if (name.length > 200 || story.length > 5000 || (socials && socials.length > 500)) {
      return json({ error: 'One of the fields is too long' }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceKey)

    const { data: application, error: insertError } = await admin
      .from('job_applications')
      .insert({ role_slug, name, email, story, socials })
      .select()
      .single()

    if (insertError) {
      console.error('job_applications insert failed', insertError)
      return json({ error: 'Could not save application' }, 500)
    }

    // Acknowledgment email. Goes through send-transactional-email, which renders
    // the registered template and enqueues a complete message for the dispatcher.
    // A raw enqueue_email call would queue an unrenderable payload and be dropped.
    try {
      const { error: emailError } = await admin.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'job-application-received',
          recipientEmail: email,
          idempotencyKey: `job-application-received-${application.id}`,
          templateData: { name },
        },
        headers: { Authorization: `Bearer ${serviceKey}` },
      })
      if (emailError) {
        // Don't fail the request — the application is already saved.
        console.error('acknowledgment email failed for job application', application.id, emailError)
      }
    } catch (emailErr) {
      console.error('acknowledgment email threw for job application', application.id, emailErr)
    }

    return json({ ok: true, id: application.id })
  } catch (err) {
    console.error('submit-job-application error', err)
    return json({ error: 'Unexpected error' }, 500)
  }
})
