# Escrow auto-release: findings, then a migration-recorded cron fix

## 1. Bookings past their release window — none

There is currently **no money stuck**. The bookings table is empty:

- bookings total: 0
- confirmed: 0
- delivery proofs: 0 (the 48h clock starts on a delivery proof)
- vendor payouts: 0

Nobody to contact, nothing to release manually. The stale key has not cost any vendor a payout yet — it would have, the first time a real booking reached 48 hours after proof of delivery.

## 2. Has release-escrow ever run successfully? No

The cron job `escrow-auto-release` (`*/15 * * * *`) sends the **anon** key in a hardcoded Authorization header. `release-escrow` compares the header against `SUPABASE_SERVICE_ROLE_KEY` exactly, so the anon key can never match.

Confirmed in the HTTP response history: a `401 {"error":"Unauthorized"}` at every `:00`, `:15`, `:30`, `:45` slot, continuously, across the full retention window. Every scheduled auto-release since deployment has failed at the door. Manual releases from the app (`mode: "client_confirmed"` / `"admin"`) use a different caller path and are unaffected.

## 3. Audit: everything that calls an edge function from the database

Cron jobs (7):

| Job | Auth | Verdict |
|---|---|---|
| escrow-auto-release | hardcoded anon JWT | **broken, fixed in this pass** |
| check-sms-balance-daily | vault | ok |
| admin-daily-brief-0700-sast | vault | ok |
| vendor-response-nudge | vault | ok |
| notification-digest | vault | ok |
| vendor-registration-reminder | vault | ok |
| recalculate-vendor-trust-scores | no HTTP call | n/a |

Triggers calling edge functions: `notify_first_message`, `notify_new_service_request`, `email_queue_wake`, `email_queue_dispatch` — all four read `email_queue_service_role_key` from the vault.

**escrow-auto-release is the only hardcoded key anywhere in cron or trigger code. There is no third.**

## 4. The remaining hourly 401s — traced, no new failure

Matched each `net._http_response` row to its `cron.job_run_details` run by timestamp:

- **16:00 (the first full hour after today's `verify_jwt` fix went live):** escrow-auto-release `401`, notification-digest `200 {"processed":0}`, vendor-registration-reminder `200 {"success":true}`, vendor-response-nudge no status.
- **Earlier slots (:00 and :30 before the fix):** two 401s per slot = escrow plus a notification function. Those are the failures already corrected today; they stopped at 16:00.

So the only recurring 401 left is escrow-auto-release itself.

One separate thing the trace surfaced, not a credential problem: `vendor-response-nudge` and some `:00` runs record no status code with `error_msg: Timeout of 5000 ms reached`. That is pg_net's 5-second client-side read timeout — the request was sent and the function keeps running, but the database never sees the outcome, so a genuine failure there would also be invisible. Worth addressing, out of scope for this pass.

## 5. Should release-escrow move to platform verification? Yes — recommendation only, not changed here

`release-escrow` uses the exact-string comparison against `SUPABASE_SERVICE_ROLE_KEY` that broke the SMS functions on rotation, and it runs with `verify_jwt = false`. Once its cron reads the vault, a rotation that leaves the vault stale silently reintroduces exactly today's failure, on the payout path.

Recommended follow-up (separate pass): set `verify_jwt = true` for `release-escrow` in `supabase/config.toml` and switch its check to the shared `isInternalCall` helper, matching the four notification functions. Caveat to handle in that pass: the app's manual `client_confirmed` / `admin` release calls also hit this function, so the auth check must accept an authenticated admin caller as well as the internal service call before the header check is tightened. That is why it does not belong in this change.

## 6. The change in this pass

A migration file under `supabase/migrations/` that unschedules and reschedules `escrow-auto-release` on the same `*/15 * * * *` cadence, reading the vault instead of carrying a key — recorded in git so cron configuration is reviewable, in the same style as the `notify_new_service_request` trigger which already hardcodes the project URL:

```sql
select cron.unschedule('escrow-auto-release');
select cron.schedule('escrow-auto-release', '*/15 * * * *', $$
  select net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/release-escrow',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'email_queue_service_role_key' LIMIT 1
      )
    ),
    body := '{"mode":"auto"}'::jsonb
  );
$$);
```

The unschedule is guarded so the migration is safe to re-run. No other cron job is touched.

### Verification

Wait for the next quarter-hour tick and confirm that slot returns `200 {"success":true,"released":0}` instead of `401`.
