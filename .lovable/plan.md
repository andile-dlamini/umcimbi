## UMCIMBI Pre-Launch Data Foundation

Implements the spec exactly as approved. Scoped strictly to additive changes — no payment, escrow, auth, or onboarding files touched.

### Files created

1. **Migration: `platform_events`** — table, 3 indexes, RLS enabled, 4 policies (authenticated insert-own, anon insert-anonymous, service_role insert, admin select via `user_roles`).
2. **Migration: `daily_briefs`** — table, 1 index, RLS enabled, 2 policies (admin select, service_role insert).
3. **`src/lib/trackEvent.ts`** — fire-and-forget client utility with `sessionStorage`-based session id; never throws.
4. **`supabase/functions/admin-daily-brief/index.ts`** — pulls vendors/profiles/events/service_requests/quotes/bookings/platform_events/previous brief in parallel, computes `rawStats`, calls Claude Sonnet 4 with the operations-brief system prompt, stores result in `daily_briefs`, enqueues email via `enqueue_email` RPC into `transactional_emails` queue, logs `pending` row in `email_send_log`, updates `email_sent` flag.

### Files edited (additive only)

5. **`supabase/functions/analyse-quote/index.ts`** — add `createClient` import; insert one `try/catch` block logging `quote_analyser_called` to `platform_events` immediately before the final success `return`. Existing logic and response shape unchanged.
6. **`src/pages/vendors/VendorsList.tsx`** — add `useEffect`, `trackEvent`, `useAuth` imports; pull `user` from `useAuth()`; add a debounced (1500ms) `useEffect` firing `search_performed` or `search_zero_results` when any filter is non-default and results have loaded.
7. **`src/pages/admin/AdminDashboard.tsx`** — add `formatDistanceToNow` import; add `dailyBrief` + `briefLoading` state; fetch latest row from `daily_briefs` inside existing `fetchAll`; render an "AI Daily Brief" Card as the first element of the main content area with skeleton fallback and empty-state copy.

### Config

8. `supabase/config.toml` — add `[functions.admin-daily-brief] verify_jwt = false` block (called by pg_cron with bearer token; matches existing pattern for other system functions).

### Manual step (user-performed, post-deploy)

9. Add pg_cron job `admin-daily-brief` at `0 5 * * *` (07:00 SAST) calling the function via `net.http_post` with the vault-stored service-role key, per the SQL block in the spec.

### Notes / clarifications before I implement

- The Step 6 code block in the spec arrived with rendering corruption: the HTML template is mostly blank lines, the `from` string shows as `'UMCIMBI @umcimbi.co.za>'`, and the `escapedBrief` regex shows empty patterns. I will write the **intended** literal values:
  - `from: "UMCIMBI <noreply@umcimbi.co.za>"` (matches the project-wide convention used in `auth-email-hook` and `raise-dispute`)
  - `sender_domain: "notify.umcimbi.co.za"`
  - `escapedBrief` will properly escape `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`
  - HTML body will be a branded indigo-header template with the brief in a styled card and a "View dashboard" link to `https://www.umcimbi.co.za/admin`, structurally matching the dispute-alert email.
- All other code blocks will be written verbatim as specified.
- No changes to existing migrations, RLS, payments, escrow, auth, or onboarding files.
- Acceptance criteria 1–10 will all be met after deploy.

Ready to proceed on approval.