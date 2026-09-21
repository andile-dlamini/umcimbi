import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.25.76'

// Public function: called from the Careers page application form.
// No auth required (applicants aren't logged in). Inserts the application
// with the service role (bypassing RLS, since only service_role can INSERT
// per the job_applications policy) and sends an acknowledgment email via
// the existing send-transactional-email function.
//
// Body: { role_slug: string, name: string, email: string, phone: string, story: string, socials: string }

const normalisePhone = (value: string) => {
  const compact = value.trim().replace(/[\s()-]/g, '')
  return compact.startsWith('0') ? `+27${compact.slice(1)}` : compact
}

const BodySchema = z.object({
  role_slug: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().transform(normalisePhone).refine(value => /^\+27[6-8]\d{8}$/.test(value)),
  story: z.string().trim().min(1).max(5000).refine(value => value.split(/\s+/).length <= 100),
  socials: z.string().trim().min(1).max(500),
})

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
    const parsed = BodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return json({ error: 'Invalid application details', fields: parsed.error.flatten().fieldErrors }, 400)
    }
    const { role_slug, name, email, phone, story, socials } = parsed.data

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceKey)

    const { data: application, error: insertError } = await admin
      .from('job_applications')
      .insert({ role_slug, name, email, phone, story, socials })
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
