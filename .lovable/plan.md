# Phase 4 — Careers admin review + automatic decline email

Final phase of the Careers feature. Adds an admin screen to read applications and change their stage, and sends a polite decline email automatically the first time an application is marked "declined".

## What you'll be able to do

- Open **Careers** in the admin sidebar (new item, after Feedback) at `/admin/careers`.
- See counts for Received / Shortlisted / Declined / Hired, filter by stage, and browse a table of applications (name, email, story preview, stage, when).
- Click a row to open a side panel with the full story, social handle, submission time, and four stage buttons.
- Marking someone **declined** emails them once, automatically; the other stages are silent.

## How it works

- Received / shortlisted / hired are saved straight to the applications table (admins already have permission from Phase 2).
- Declined goes through a new secure server action, because sending email needs elevated access. It checks the caller is signed in and holds the admin role before doing anything; anyone else gets refused.
- The email fires only on the move *into* declined — clicking "declined" again on an already-declined application sends nothing, so nobody gets a duplicate.
- The email itself matches the existing acknowledgment email's styling and copy, signed by Andile.

## Technical details

New files:
- `supabase/functions/_shared/transactional-email-templates/job-application-declined.tsx` — React Email template exactly as specified (subject "An update on your UMCIMBI application", Fraunces/Nunito styles mirroring `job-application-received.tsx`).
- `supabase/functions/update-job-application-status/index.ts` — body `{ id, status }`, status validated against the four allowed values; JWT verified with the anon client, admin role checked against `user_roles` with the service role (same pattern as `send-waitlist-launch-emails`); fetches the row, updates status, and on the transition into `declined` invokes `send-transactional-email` with `templateName: 'job-application-declined'` and `idempotencyKey: job-application-declined-<id>`; email failures are logged, not fatal.
- `src/pages/admin/AdminCareers.tsx` — modeled on `AdminFeedback.tsx` (Card/Table/Sheet/Select/Badge, `useToast`), typed `JobApplicationRow`, status filter, optimistic local row update after a successful write.

Edits:
- `supabase/functions/_shared/transactional-email-templates/registry.ts` — register `'job-application-declined'` alongside the two existing templates.
- `supabase/config.toml` — add `[functions.update-job-application-status]` with `verify_jwt = false` (auth handled in-function).
- `src/App.tsx` — import `AdminCareers`, add `<Route path="careers" element={<AdminCareers />} />` inside the existing `/admin` block next to `feedback`.
- `src/components/admin/AdminSidebar.tsx` — add `Briefcase` import and `{ label: 'Careers', to: '/admin/careers', icon: Briefcase }` after Feedback.

No database migration — the `job_applications` table and its policies already exist from Phase 2.

## Verification

- Deploy the function, then load `/admin/careers` as an admin in the preview and confirm applications list.
- Move a test application to shortlisted, then hired — confirm the table and a direct read agree, and no email row is created.
- Move it to declined — confirm a `sent` row in `email_send_log` for the decline template; click declined again and confirm no second send.
- Call the function signed-out — expect 401, no status change.
- Confirm the sidebar item routes correctly and the build log is clean.

A test application is created and deleted as part of this; no real applicant is emailed.
