# Public vendor directory for logged-out visitors

## 1. Database (run via the migration tool, not hand-written migration files)

**Migration A — anonymous-safe directory view**

```sql
CREATE OR REPLACE VIEW public.vendors_directory_public
WITH (security_invoker = off) AS
SELECT id, name, category, location, city, state_province,
       image_urls, logo_url, rating, review_count,
       is_super_vendor, business_verification_status, is_active
FROM public.vendors
WHERE is_active = true AND public.is_province_live(state_province);

GRANT SELECT ON public.vendors_directory_public TO anon, authenticated;
```

No contact, pricing, address, geo, financial or verification-internal columns are exposed. The base `vendors` table, its RLS, and the existing `vendors_public` view are untouched.

**Migration B — reconcile the hourly reminder cron**

Unschedule `vendor-registration-reminder` inside an exception-swallowing `DO` block, then re-`cron.schedule` it at `0 * * * *` posting to the `vendor-registration-reminder` function with the vault service-role key. Result: exactly one active job, no gap.

## 2. Frontend

**`src/components/shared/VendorCard.tsx`** — add optional `onCardClick?: () => void`; when present it short-circuits the default navigate. Every existing caller is unchanged.

**`src/pages/vendors/PublicVendorsList.tsx` (new)** — standalone logged-out page:
- Loads from `vendors_directory_public`, ordered by super-vendor then rating.
- Client-side name search + category filter using `LIVE_VENDOR_CATEGORY_FILTER_OPTIONS`.
- Header with a "Sign in" link; hero heading and "Sign in to request a quote" subcopy.
- Card click → `/auth?mode=signup&role=planner&redirect=%2Fvendors%2F<id>`.
- Loading and empty states.

**`src/App.tsx`** — import `PublicVendorsList` and add `<Route path="/vendors" element={<PublicVendorsList />} />` to the **logged-out** route tree only.

**`src/pages/auth/AuthPage.tsx`** — read a `redirect` search param and use it for post-login navigation (line 464) and the signup success button (line 1144, planner branch only; vendors still go to `/vendor-dashboard`).

## Technical notes
- Supabase types regenerate after the migration, so `.from('vendors_directory_public')` types cleanly; if the type isn't present yet at build time I'll cast the query rather than edit generated files.
- Vendors with a null/non-live `state_province` are excluded by `is_province_live`, matching the live-province gating used elsewhere.

## Out of scope
Authenticated `VendorsList`, `VendorDetail`, `useVendorsWithDistance`, `vendors_public`, base-table RLS, admin approval/verification flows. `/vendors/:id` stays authenticated-only.

## Verification
- Typecheck.
- Headless logged-out visit to `/vendors`: cards render with name/category/area/photo/rating; no phone, email or price in DOM or network payloads.
- Card click lands on `/auth?mode=signup&role=planner&redirect=...` with the role-choice screen skipped.
- Logged-in `/vendors` still renders the existing authenticated list unchanged.
- Query `cron.job` to confirm a single active `vendor-registration-reminder` entry.
