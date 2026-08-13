# Close the forgeable internal-auth gate

You are right: `isInternalCall` base64-decodes the JWT payload and trusts `role: "service_role"` without ever checking a signature. On functions with `verify_jwt = false` nothing else stands in the way, so a hand-made token would let anyone trigger vendor SMS at our cost.

## Blast radius (confirmed)

`_shared/internalAuth.ts` is imported by exactly four functions, no others:

- `notify-first-message`
- `notify-vendor-event`
- `notification-digest`
- `vendor-response-nudge`

All four are `verify_jwt = false` in `supabase/config.toml`, so the unverified decode is currently their only gate.

## Which fix and why

Take the platform-verification route: set `verify_jwt = true` for all four, exactly matching `process-email-queue`, and demote the claim check to defence in depth behind it.

Reason: verifying a signature inside the function would mean handling the project's JWT secret (or JWKS fetching plus caching plus key-rotation handling) in four places — a second, home-grown verifier that has to stay correct forever. The platform already does this before the body runs and is the pattern this project's other internal function uses. Callers are DB triggers and cron jobs that already send a real service-role JWT, so they keep working.

## Changes

1. `supabase/config.toml` — flip `verify_jwt` to `true` for the four functions above.
2. `supabase/functions/_shared/internalAuth.ts`:
   - Remove the hand-rolled `parseJwtClaims` trust path as a standalone gate.
   - Keep: exact match against `SUPABASE_SERVICE_ROLE_KEY`, plus a claim check that is now only reached after the platform has verified the signature.
   - Rewrite the comment to state the real trust model (platform verifies first; claim check is defence in depth), removing the incorrect `process-email-queue` comparison.
3. No changes to the four function bodies beyond what the helper contract requires.

## Verification

- Confirm a forged token (valid shape, `role: service_role`, garbage signature) is rejected with 401 by the platform.
- Re-fire one real trigger path (a first-message alert) and confirm HTTP 200 and a `provider_response` row in `sms_notification_log`.
- Confirm the cron-driven digest and nudge functions still authenticate after the flip; if the vault-stored key turns out to be a non-JWT or stale-signature value, the fallback is to re-sync the vault secret rather than reopening the unverified path.
