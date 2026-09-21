# Phase 2: Careers applications table + two cosmetic fixes

Scope is exactly the Phase 2 prompt: one database migration and two unrelated cosmetic frontend fixes. No edge function, no change to the live mailto: submission, no Phase 3/4 work.

## 1. Migration — `public.job_applications`

Run through the migration tool with the SQL from the prompt, verbatim in structure:

- `CREATE TABLE IF NOT EXISTS public.job_applications` — role_slug, name, email, story (all NOT NULL), socials (nullable), status TEXT DEFAULT 'received' with CHECK limited to received | shortlisted | declined | hired, created_at/updated_at defaults.
- `GRANT SELECT, UPDATE ON public.job_applications TO authenticated;` + `GRANT ALL ... TO service_role;` — required in the same migration (no anon grant; applicants never write directly, the Phase 3 edge function uses service role).
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
- Three policies using the existing `public.has_role()` helper (verified present in migrations):
  - Admins read (SELECT, USING has_role admin)
  - Admins update (UPDATE, USING + WITH CHECK has_role admin)
  - Service role insert (INSERT, WITH CHECK auth.role() = 'service_role')
- Two indexes: status, role_slug.
- `updated_at` trigger so the timestamp stays accurate for Phase 4's status changes (matches the codebase's existing update_updated_at trigger pattern).

No frontend or edge function changes — the careers page keeps submitting via mailto: exactly as it does now.

## 2. Back button anchor — `src/pages/careers/CareersVendorGrowthManager.tsx`

Line 75: `<Link to="/onboarding">` → `<Link to="/onboarding#careers">`. One-line change, nothing else in the file.

## 3. Indentation fix — `src/App.tsx`

In the "Fully authenticated" block (line 149), `<Routes>` currently has two extra leading spaces versus its child `<Route>` elements. Re-indent `<Routes>` to align with its children, matching the logged-out block's style. Whitespace only — no logic change.

## Verification

- Migration applies cleanly; then confirm via a read query that RLS is enabled, the three policies exist, and an unauthenticated client cannot select/insert/update (should fail).
- Playwright: navigate to /careers/vendor-growth-manager, click Back, confirm it lands on /onboarding scrolled to the Careers section (not the top).
- Confirm the App.tsx change is whitespace-only (diff shows no logic changes).
- Check build-errors.log is clean.
