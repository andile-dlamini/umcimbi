# Close the forgeable internal-auth gate

`isInternalCall` base64-decodes the JWT payload and trusts `role: "service_role"` without checking a signature. On functions with `verify_jwt = false` nothing else stands in the way, so a hand-made token would let anyone trigger vendor SMS at our cost.

## Blast radius (confirmed)

`_shared/internalAuth.ts` is imported by exactly four functions, no others:

- `notify-first-message`
- `notify-vendor-event`
- `notification-digest`
- `vendor-response-nudge`

All four are `verify_jwt = false` in `supabase/config.toml`, so the unverified decode is currently their only gate.

## Your unknown: what format is the vault secret?

Checked before planning:

- `SUPABASE_SERVICE_ROLE_KEY` in the function environment is **JWT-shaped** (three dot-separated segments, ~200+ chars), **not** an `sb_secret_` key.
- `vault.secrets` row `email_queue_service_role_key` was last updated **2026-08-13 15:33 UTC** — the `sync-internal-key` run that copied that same env value in. The decrypted value itself cannot be read back by tooling, but its provenance is that JWT.
- Live confirmation that the vault token is a `service_role` JWT and not an opaque key: the trigger-fired `first_message_to_vendor` at 15:54 and the 16:00 Tier 2 digest both authenticated and wrote log rows. The current helper only accepts either an exact match to the env JWT or a token whose payload decodes to `role: service_role` — an `sb_secret_` value would satisfy neither.

So the vault holds a legacy `service_role` JWT and `verify_jwt = true` is viable. The plan still treats it as something to prove, not assume, and carries a rollback.

## Which fix and why

Route A: set `verify_jwt = true` for all four, matching `process-email-queue`, and demote the claim check to defence in depth behind platform verification.

Reason: in-function signature verification means handling the project's JWT secret or JWKS fetching, caching and key rotation in a home-grown verifier that has to stay correct forever. The platform already does this before the body runs, and it is the pattern the project's other internal function uses.

## Changes

1. `supabase/config.toml` — `verify_jwt = true` for the four functions.
2. `supabase/functions/_shared/internalAuth.ts`:
   - Remove `parseJwtClaims` as a standalone gate.
   - Keep the exact match against `SUPABASE_SERVICE_ROLE_KEY`, plus a claim check that is now only reached after the platform has verified the signature.
   - Rewrite the comment to state the real trust model and drop the incorrect `process-email-queue` comparison.
3. No changes to the four function bodies.

## Proving it end to end (not "it compiles")

In order, before the task is called done:

1. **Forgery is rejected.** Call `notify-first-message` with a syntactically valid token carrying `role: service_role` and a garbage signature. Expect 401 from the platform, and no new `sms_notification_log` row.
2. **The real trigger path still works.** Send an actual first chat message to the Siyaphila test vendor from the demo organiser account so `notify_first_message()` fires with the vault token. Then confirm in `sms_notification_log`: a fresh `first_message_to_vendor` row whose `provider_response` is populated with the Connect Mobile reply (e.g. `Accepted for delivery` plus message id). A row with a null `provider_response` counts as a failure, not a pass.
3. **Cron paths still authenticate.** Confirm the next Tier 2 `notification-digest` run inserts rows after the flip, and manually invoke `vendor-response-nudge` and `notify-vendor-event` expecting a non-401 response.

Because `net.http_post` is fire and forget, step 2 is the only signal that matters. If it comes back missing or with an empty `provider_response`, the immediate action is to re-sync the vault to the current `SUPABASE_SERVICE_ROLE_KEY` JWT and retry — not to reopen the unverified decode. If a re-synced JWT still fails platform verification (possible only if the project has moved to signing keys and rejects the legacy key), the fallback is Route B: revert `verify_jwt` to `false` for the affected function and verify the token in-function against JWKS, keeping the exact-key match as the primary path. Either way, the unverified decode does not come back.
