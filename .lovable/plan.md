# Escrow auto-release: findings first, then a one-line cron fix

## 1. Bookings past their release window — none

There is currently **no money stuck**. The bookings table is empty:

- bookings total: 0
- confirmed: 0
- delivery proofs: 0 (the 48h clock starts on a delivery proof)
- vendor payouts: 0

So there is nobody to contact and nothing to release manually. The stale key has not cost any vendor a payout yet — it would have, the first time a real booking reached 48 hours after proof of delivery.

## 2. Has release-escrow ever run successfully? No

The cron job `escrow-auto-release` (`*/15 * * * *`) sends the **anon** key in its hardcoded Authorization header. `release-escrow` compares the header against `SUPABASE_SERVICE_ROLE_KEY` exactly, so the anon key can never match.

Confirmed in the HTTP response history: a `401 {"error":"Unauthorized"}` at every `:00`, `:15`, `:30`, `:45` slot, continuously, for the full retention window. Every scheduled auto-release since deployment has failed at the door. Manual releases (`mode: "client_confirmed"` / `"admin"`) from the app are unaffected — they use a different caller path.

## 3. Audit of everything else that calls an edge function from the database

Cron jobs (7 total):

| Job | Auth | Verdict |
|---|---|---|
| escrow-auto-release | hardcoded anon JWT | **broken, to fix** |
| check-sms-balance-daily | vault | ok |
| admin-daily-brief-0700-sast | vault | ok |
| vendor-response-nudge | vault | ok |
| notification-digest | vault | ok |
| vendor-registration-reminder | vault | ok |
| recalculate-vendor-trust-scores | no HTTP call | n/a |

Database triggers that call edge functions: `notify_first_message`, `notify_new_service_request`, `email_queue_wake`, `email_queue_dispatch`. All four read `email_queue_service_role_key` from the vault. No other hardcoded key exists anywhere in cron or trigger code.

**escrow-auto-release was the only one.**

One loose end worth noting, not fixed in this pass: a few 401s still appear at some hourly slots beyond the escrow ones. Once escrow is switched to the vault, the remaining 401 pattern becomes readable and I can trace which hourly job owns it.

## 4. The change

Reschedule `escrow-auto-release` with the same 15-minute cadence, replacing the hardcoded header with the vault lookup used by every other job:

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

Because this SQL embeds the project URL and touches vault state, it goes through the data-insert path rather than a migration file, matching how the other cron jobs were created.

### Verification after the change

Wait for the next quarter-hour tick and confirm the response for that slot is `200 {"success":true,"released":0}` instead of `401`. No other cron is touched.
