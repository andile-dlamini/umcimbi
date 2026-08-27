# Remove the access-token gate on the Ozow payout notification endpoint

Ozow's payout notification webhook does not send merchant-side auth (confirmed by Ozow support during staging testing), so the token check is what has been turning every `PayoutCompleted` callback into a "Notify Failed". Removing it lets those callbacks land and update the payout.

## Change (single file: `supabase/functions/ozow-payout-notification/index.ts`)

- Delete `expectedAccessToken`, `providedAccessToken`, `authorized`, and the whole `if (!authorized) { ... }` block — including its `console.error`, the `notification_rejected` insert into `payout_webhook_events`, and the 401 response.
- Flow becomes: parse payload → on parse failure return the existing 400 → straight into the existing `try` block (`extractRefs`, payout lookup, `vendor_payouts` update).
- Delete the now-unused `getToken()` helper.

## Left untouched

Reference matching (`refCandidates`, `filters`), redaction (`redactValue`, `redactHeaders`, `isSensitiveKey`, `SENSITIVE_KEYS`), the `notification_unmatched` logging path, status normalization, and the `payout_released` SMS trigger on normalized `paid`. No changes to `ozow-payout-verification`, `ozow-webhook`, `supabase/config.toml`, or any other file.

## Then

Redeploy the function and confirm an unauthenticated probe now returns a non-401 response (a `404 Payout not found` for a bogus reference is the expected result), with the attempt recorded as `notification_unmatched`.

## Note

This makes the endpoint publicly writable in the sense that anyone who guesses a payout reference could push a status onto it. Payout state changes are already reconciled against Ozow's console manually, and the endpoint never moves money, so the exposure is a status-field spoof rather than a financial one. If you want a defence later, an IP allowlist of Ozow's notification egress ranges is the usual fit — say the word and I'll add it as a follow-up.
