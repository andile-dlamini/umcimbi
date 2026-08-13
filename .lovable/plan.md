# SMS notifications: diagnosis

## What I found

The scheduled SMS jobs are running on time, but every call they make is being rejected.

- All four notification cron jobs (vendor response nudge, notification digest, vendor registration reminder, admin daily brief) fire on schedule and report "succeeded" — cron itself is healthy.
- Every HTTP call those jobs make to the notification functions in the last 24 hours came back `401 {"error":"Unauthorized"}` (41 responses, most recent 13:47 UTC today). Zero succeeded.
- The last SMS actually delivered was on 8 Aug (`vendor_registration_reminder_72h`). Nothing has been sent since.
- The cron jobs authenticate by reading the vault secret `email_queue_service_role_key` and sending it as the Bearer token. The functions (`notification-digest`, `vendor-response-nudge`, `notify-vendor-event`) compare that token byte-for-byte against their own `SUPABASE_SERVICE_ROLE_KEY` environment value and return 401 on mismatch.

Vault contents can't be read directly through the query tool, so the stored value can't be printed for comparison. But the evidence is conclusive: correct schedule, correct URLs, blanket 401 on the exact auth path that depends on that one secret. The stored copy of the service role key no longer matches the live one.

A second, smaller symptom: today's `quote_sent` log row was written with an empty provider response, meaning the send path was entered but the SMS provider never confirmed delivery. This is likely the same 401 wall on `notify-vendor-event`; it will be re-checked after the key is fixed rather than treated as a separate bug up front.

## Fix (on approval)

1. Re-bind the backend service credentials so the current service role key is known to the environment.
2. Overwrite the vault secret `email_queue_service_role_key` with that current key (update in place, same name — no cron job changes needed).
3. Manually trigger `notification-digest` and `vendor-response-nudge` once and confirm they return 200 instead of 401.
4. Re-check the `quote_sent` path: confirm a fresh Tier 1 event produces a log row with a real provider response ("Accepted for delivery"), and if not, diagnose that separately.
5. Report which pending notifications, if any, were flushed by the first successful run.

No frontend or edge function code changes are expected — this is a credential mismatch, not a logic bug.
