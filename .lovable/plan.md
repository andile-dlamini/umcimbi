# Lock function EXECUTE grants + require internal caller on vendor-registration-reminder

Exactly two changes, nothing else.

## Change 1 — ONE new migration in `drizzle/migrations/`

Created via the database migration tool with the uploaded SQL verbatim (34 lines, comment header + 19 functions in three groups):

1. Eight callable RPCs (admin stats, pipeline, stalled conversations, vendor bank details, dormancy reset, view-count increment): `REVOKE EXECUTE ... FROM PUBLIC, anon` then `GRANT ... TO authenticated, service_role`.
2. Two backend-only functions (`get_vendor_last_sign_in(uuid)`, `email_queue_dispatch()`): revoke from `PUBLIC, anon, authenticated`, grant to `service_role` only.
3. Nine trigger functions (`add_vendor_role`, `cleanup_expired_otps`, `email_queue_wake`, `evaluate_super_vendor`, `handle_new_user`, `limit_vendor_images`, `notify_first_message`, `notify_new_service_request`, `update_vendor_rating`): revoke direct EXECUTE from `PUBLIC, anon, authenticated`.

Pre-checked: all 19 functions exist in `public` with matching signatures, so no statement will fail on a missing function. No data changes, no DDL beyond GRANT/REVOKE.

## Change 2 — vendor-registration-reminder internal-caller gate

Same pattern as organiser-activation-nudge:

- `supabase/config.toml`: under `[functions.vendor-registration-reminder]`, `verify_jwt = false` → `verify_jwt = true`. Nothing else in the file changes.
- `supabase/functions/vendor-registration-reminder/index.ts`:
  - Add `import { isInternalCall } from '../_shared/internalAuth.ts';` with the other imports.
  - `Deno.serve(async (_req) => {` → `Deno.serve(async (req) => {`.
  - First line inside the handler:
    `if (!isInternalCall(req)) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });`

`_shared/internalAuth.ts` is already written for `verify_jwt = true` functions (platform verifies the signature; the claim check is defence in depth), so no shared-file change is needed.

## Verification

- Migration applies cleanly (all functions pre-confirmed).
- Function grants re-checked via query after applying: anon has no EXECUTE on any of the 19.
- `vendor-registration-reminder` cron still authenticates: invoke it with the service-role token and expect a non-401 response; an unauthenticated call with a forged `service_role`-claim token returns 401 from the platform.

## Out of scope (untouched)

`has_role`, `is_province_live`, `get_vendor_public_stats`, every storage policy, every cron job, `_shared/internalAuth.ts`, all other edge functions, all frontend files.
