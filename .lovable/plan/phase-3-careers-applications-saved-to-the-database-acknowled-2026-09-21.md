# Phase 3 — Careers applications saved to the database + acknowledgment email

The application form stops opening an email program and instead saves the
application and emails the applicant a confirmation automatically.

## What changes

1. **New submission handler** (`submit-job-application`) — public, no login needed.
   Validates that name, email, story and role are present, saves the row into
   `job_applications` (status `received`), then triggers the acknowledgment email.
   Returns a clear 400 when a field is missing, so nothing is saved.

2. **New acknowledgment email template** `job-application-received` —
   "Thanks for applying", signed Andile, in the same house style as the existing
   launch email (Fraunces heading, Nunito body, white background).
   Registered in the template registry alongside `launch-announcement`.

3. **Careers page form** — submits to the new handler, shows a "Sending…" state,
   a success panel ("Thanks — we've got your application. We'll be in touch by
   email either way.") and an error message pointing to andile@umcimbi.co.za if
   the send fails. The `mailto:` link is removed entirely.

## Two corrections to the brief

- **Email must go through `send-transactional-email`, not a raw `enqueue_email` call.**
  The queue in this project expects a fully rendered message (subject, html, text,
  unsubscribe token, sender domain). A payload of `{ template, to, data }` would be
  queued and then dropped by the dispatcher, so the applicant would never get the email.
  The handler will instead invoke the existing `send-transactional-email` function with
  the service-role key, `templateName: 'job-application-received'`, the applicant's
  email, and an idempotency key derived from the new application id. Email failures
  are logged and do not fail the request — the application is already saved.

- **The function must be registered in `supabase/config.toml` with `verify_jwt = false`**,
  otherwise applicants (who are signed out) get a 401. The brief omitted this.

Also: the careers page code in the brief arrived with its markup mangled by the paste,
so the page will be edited in place (submit logic, success/error state, imports) rather
than overwritten — all existing copy, the job listing data, the word counter and the
`/onboarding#careers` back link stay byte-identical.

## Technical notes

- `supabase/functions/submit-job-application/index.ts`: CORS preflight, JSON body
  `{ role_slug, name, email, story, socials? }`, basic email-shape and length checks,
  service-role insert into `job_applications`, then
  `admin.functions.invoke('send-transactional-email', …)` with the service-role
  Authorization header. Responds `{ ok: true, id }`.
- `supabase/functions/_shared/transactional-email-templates/job-application-received.tsx`:
  React Email component exactly as specced, `satisfies TemplateEntry`, inline styles.
- `registry.ts`: import + `'job-application-received'` entry added, existing entry untouched.
- `src/pages/careers/CareersVendorGrowthManager.tsx`: `supabase.functions.invoke`,
  `submitting` / `submitted` / `error` state, `CheckCircle2` success panel; header
  comment updated to Phase 3.
- Deploy `submit-job-application` and `send-transactional-email` (registry change).

## Verification

- Submit a test application on the live page; confirm a `job_applications` row with
  `status = 'received'`, and an `email_send_log` row reaching `sent` for that address.
- Submit with a field missing; confirm a 400, the inline error, and no new row.
- Confirm no `mailto:` remains in the file and the build log is clean.

## Not in this phase

Admin review page and auto-decline email (Phase 4).
