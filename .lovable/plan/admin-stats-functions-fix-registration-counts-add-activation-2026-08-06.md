# Admin stats functions: fix registration counts, add activation stats

Backend-only change. No frontend files touched.

## Part A — Fix `get_admin_user_registration_stats()`

Replace the existing function so vendor and organiser counts are accurate:

- Exclude demo and banned vendors from both vendor counts.
- Exclude anyone who already owns a vendor record from the organiser counts (previously vendor-role signups without a completed profile were counted as organisers).
- Exclude demo profiles.
- Use South African time (Africa/Johannesburg) for the "this month" boundary instead of UTC.

Admin-only access is preserved.

## Part B — New `get_admin_activation_stats()`

Adds a single admin-only function returning funnel/activation metrics in one row:

- Real vendors, and how many have ever been requested, responded, or quoted.
- Real organisers, and how many have created a ceremony or sent a request.
- Total ceremonies and how many have at least one request.
- Requests still awaiting a vendor, quotes still awaiting a client (non-expired), both scoped to real vendors only (excludes demo/banned).
- Median hours to first vendor response, left unscoped across all answered requests for a wider sample.

## Technical notes

- Both statements go into one new migration file under `supabase/migrations/` (via the migration tool, which writes the file), using the exact SQL provided, including the `GRANT EXECUTE ... TO authenticated` for each function.
- Verified against the live schema: `vendors.is_demo`, `vendors.is_banned`, `profiles.is_demo`, `service_requests.expires_at/responded_at/requester_user_id`, `quotes.expires_at`, and the `pending_client` quote status all exist.
- `src/integrations/supabase/types.ts` regenerates automatically once the migration is applied; no manual edit.
- No frontend wiring for `get_admin_activation_stats()` in this task — it will exist unused until a later task surfaces it in the admin UI.
