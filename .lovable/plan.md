# Move the selfie verification token out of the vendors table

The one-time selfie link token currently lives in a column on the vendors table, which every signed-in user can read. It moves into its own locked-down table that no client can read or write — only backend code can.

## 1. Database migration (new file in supabase/migrations)

Create `public.vendor_selfie_requests`:

- `id` uuid primary key, default `gen_random_uuid()`
- `vendor_id` uuid not null, references `public.vendors(id)` on delete cascade
- `token` text not null unique
- `expires_at` timestamptz not null
- `consumed_at` timestamptz null
- `created_at` timestamptz not null default `now()`
- Indexes on `token` and `vendor_id`

Access:
- Enable row level security, create **no policies**, and issue **no grants** to `anon` or `authenticated`. Only the service role (backend) can touch it. This is deliberate.

Data move:
- Insert one row per vendor whose `selfie_request_token` is not null, carrying the token, `expires_at = now() + 24 hours`, and **`consumed_at = now()`** — those tokens have been readable by every signed-in user, so they migrate dead rather than live. A query against the database right now returns **zero** vendors with a token, so this affects **0 rows** and no vendor needs a re-issued link. The insert stays in the migration in case a token is created before it runs.
- Then drop `selfie_request_token` (and its partial index) from `public.vendors`.
- `selfie_request_sent_at` stays on vendors, untouched.
- No RLS policy on `public.vendors` is changed.

## 2. Edge function: vendor-selfie-submission

- Look the token up in `vendor_selfie_requests` (`id, vendor_id, expires_at, consumed_at`) instead of on vendors.
- Reject with the existing 404 / "Invalid or expired token" when: no row, `consumed_at` already set, or `expires_at` in the past. All other response shapes and status codes unchanged, so the submission page needs no changes.
- On success: upload the photo as today, update vendors with `selfie_photo_url` only, then set `consumed_at = now()` on the request row so the token cannot be reused.
- `verify_jwt` and the service-role client stay as they are.

## 3. New edge function: create-vendor-selfie-request

The admin page runs as a normal authenticated user, and the new table intentionally has no policies, so the admin cannot insert directly. A small service-role function handles it:

- Verifies the caller's JWT and that the caller has the `admin` role; otherwise 403.
- Marks any existing unconsumed rows for that vendor as consumed (a new link invalidates the old one).
- Inserts a new row with the supplied vendor id, a server-generated token, and `expires_at = now() + 24 hours`.
- Returns the token to the admin page so the existing link format and SMS sends stay identical.

## 4. src/pages/admin/VendorVerificationQueue.tsx

`handleRequestSelfie` calls the new function instead of writing the token onto the vendors row, and uses the returned token to build the link. It still updates `selfie_request_sent_at` on the vendor row, still fires the same two `send-vendor-status-sms` invocations, same link format, same toast and refresh.

## Verification

- `selfie_request_token` no longer exists on `public.vendors`.
- `vendor_selfie_requests` has RLS enabled and zero policies; a client read attempt returns nothing/permission denied.
- The migration file exists in `supabase/migrations`.
- Admin can generate and send a selfie link; a vendor can submit through it.
- The same token used a second time returns 404, and an expired token returns 404.

## Out of scope

No changes to vendors RLS policies, `verify_jwt` settings, `/verify/selfie` or `SelfieSubmission.tsx`, the `vendor-selfies` bucket, quote/booking/payment/payout code, SMS work, or the public landing pages.
