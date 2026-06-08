## Part A — Migration

Add to `public.vendors`:
- `is_banned boolean NOT NULL DEFAULT false`
- `admin_approval_notes text`
- `selfie_request_token text`
- `selfie_request_sent_at timestamptz`
- `selfie_photo_url text`

Create private storage bucket `vendor-selfies` (via storage tool, not SQL INSERT).

Add two indexes:
- `idx_vendors_selfie_token` (partial, on `selfie_request_token` where not null)
- `idx_vendors_approval_queue` on `(is_active, is_banned, is_demo, created_at)`

No RLS changes needed (Storage uploads go through service role from edge functions).

## Part B — Edge Function `send-vendor-status-sms`

`supabase/functions/send-vendor-status-sms/index.ts` + `verify_jwt = false` in `config.toml`.

**Auth gate**: read `Authorization: Bearer <token>`.
- If token === `SUPABASE_SERVICE_ROLE_KEY` → allow.
- Else verify JWT via service-role client `auth.getUser(token)`, then check `user_roles` for `admin`. Reject 401/403 otherwise.

**Body**: `{ vendor_id: uuid, sms_type: enum, notes?: string }` (Zod validated).
Allowed `sms_type`: `registration | approved | request_info | request_selfie | selfie_link | rejected | banned`.

**Flow**:
1. Service-role client fetches `name, phone_number` from `vendors` by `vendor_id`.
2. Build message from template (substitute `[name]` and `[notes]`; for `rejected` omit notes clause if absent; `banned` ignores notes).
3. Normalize phone: strip non-digits; if starts with `0`, replace leading `0` with `27`; if starts with `27`, keep; else keep digits.
4. GET `https://sms.connect-mobile.co.za/submit/single/?da={phone}&ud={encodeURIComponent(msg)}&id={crypto.randomUUID()}` with `Authorization: Bearer ${CONNECT_MOBILE_API_KEY}`.
5. Return `{ success: true, sms_type }` or 502 with provider error.

CORS headers on all responses.

## Part C — Edge Function `vendor-selfie-submission`

`supabase/functions/vendor-selfie-submission/index.ts` + `verify_jwt = false` in `config.toml`.

No auth — token in body is the auth.

**Body**: `{ token: string, photo_base64: string, mime_type: string }` (Zod validated; mime_type whitelist: `image/jpeg|image/png|image/webp`; max decoded size ~10 MB).

**Flow**:
1. Service-role client: `select id from vendors where selfie_request_token = token` → 404 if not found.
2. Decode base64 → Uint8Array; choose extension from mime.
3. Upload to `vendor-selfies` bucket at `{vendor_id}/selfie-{Date.now()}.{ext}` with `contentType`.
4. Update vendor: `selfie_photo_url = <storage path>`, `selfie_request_token = null` (one-time use).
5. Return `{ success: true }`.

## Deploy
Both functions auto-deploy as Lovable-managed.

## Out of scope
- No frontend changes
- No admin page wiring (separate request)
- No changes to existing functions

## Secrets check
`CONNECT_MOBILE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL` are already configured.