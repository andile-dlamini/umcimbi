# Move the selfie verification token out of the vendors table

The selfie link token currently lives on the vendor record. Because vendor rows are readable by any signed-in user and Postgres access rules work per row (not per column), that token is effectively public. Anyone could use it to submit an identity photo as another vendor and burn the real vendor's link.

This moves the token into its own locked-down table that no client can read.

## 1. Database migration (new file in supabase/migrations)

Create `public.vendor_selfie_requests`:

- `id` uuid primary key, default `gen_random_uuid()`
- `vendor_id` uuid not null, references `public.vendors(id)` on delete cascade
- `token` text not null unique
- `expires_at` timestamptz not null
- `consumed_at` timestamptz null
- `created_at` timestamptz not null default `now()`

Indexes on `token` and `vendor_id`.

Row level security enabled with **zero policies and no grants to anon/authenticated** — only the service role (edge functions) can touch it. `GRANT ALL ... TO service_role` only.

Then:
- Copy every vendor with a live token into the new table (`expires_at = now() + 24 hours`, `consumed_at = null`).
- Drop `selfie_request_token` from `public.vendors`.

`selfie_request_sent_at` stays on vendors — the admin queue reads it and it is not sensitive. No vendor access-rule changes in this migration.

## 2. New edge function: `create-vendor-selfie-request`

The admin page cannot insert into a table with no policies, so the insert moves server-side.

- Reuses the exact admin authorisation pattern already in `send-vendor-status-sms` (bearer token → `auth.getUser` → `user_roles` admin check; service-role key also accepted).
- Input validated with Zod: `{ vendor_id: uuid }`.
- Marks any existing unconsumed rows for that vendor as consumed (new link invalidates the old one), generates a fresh UUID token, inserts a row with `expires_at = now() + 24h`, and sets `selfie_request_sent_at` on the vendor.
- Returns `{ token }` so the admin page can build the same link.
- No `config.toml` change needed beyond registering this function's own entry (JWT verification stays on, matching the internal-verify pattern used by the other admin functions).

## 3. `supabase/functions/vendor-selfie-submission/index.ts`

- Look the token up in `vendor_selfie_requests` (`id, vendor_id, expires_at, consumed_at`) instead of on `vendors`.
- Reject with the existing 404 / "Invalid or expired token" when: no row, `consumed_at` already set, or `expires_at` in the past.
- On success: upload as today, update `vendors.selfie_photo_url` only, and set `consumed_at = now()` on the request row so the token cannot be reused.
- Response shapes, status codes, and `verify_jwt = false` all unchanged.

## 4. `src/pages/admin/VendorVerificationQueue.tsx`

`handleRequestSelfie` stops writing to the vendors row. It calls the new edge function, takes the returned token, and continues exactly as before: the same two `send-vendor-status-sms` calls, the same `/verify/selfie?token=...` link, the same toast and refresh.

## Not touched

Vendor access policies, `verify_jwt` on existing functions, the `/verify/selfie` page and its client code, the `vendor-selfies` bucket, quotes/bookings/payments/payouts, and all public landing/directory surfaces.

## Verification

- Confirm `selfie_request_token` is gone from `public.vendors`.
- Confirm `vendor_selfie_requests` has RLS on and zero policies.
- Confirm the migration file exists in `supabase/migrations`.
- Confirm an anon/authenticated client gets a permission error selecting from the new table.
- End-to-end: admin generates a link, vendor submits a photo, the same token then fails on reuse, and an expired token is rejected.
