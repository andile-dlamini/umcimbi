## Change

In `supabase/functions/ozow-payout-notification/index.ts`, strip all auth/token validation so any POST from Ozow is accepted and processed.

### Edits

1. Remove the `getToken()` helper function entirely.
2. In the `Deno.serve` handler, remove these lines:
   - `const configuredToken = (Deno.env.get("OZOW_PAYOUT_ACCESS_TOKEN") ?? "").trim();`
   - `if (!configuredToken) return jsonResponse({ error: "Notification unavailable" }, 500);`
   - `const token = getToken(req, payload);`
   - `if (!token || token !== configuredToken) return jsonResponse({ error: "Unauthorized" }, 401);`
3. Keep everything else identical: CORS, OPTIONS handling, method check, payload parsing, ref extraction, payout lookup, `payout_webhook_events` insert, `vendor_payouts` update, and the final 200 response.

No other files change. No config changes (function already deploys with `verify_jwt = false`).
