# SMS notifications: diagnosis

## What I found

The scheduled SMS jobs are running on time, but every call they make is being rejected.

- All four notification cron jobs (vendor response nudge, notification digest, vendor registration reminder, admin daily brief) fire on schedule and report "succeeded" — cron itself is healthy.
- Every HTTP call those jobs make to the notification functions in the last 24 hours came back `401 {"error":"Unauthorized"}` (41 responses, most recent 13:47 UTC today). Zero succeeded.
- The last SMS actually delivered was on 8 Aug (`vendor_registration_reminder_72h`). Nothing has been sent since.
- The cron jobs authenticate by reading the vault secret `email_queue_service_role_key` and sending it as the Bearer token. The SMS functions (`notification-digest`, `vendor-response-nudge`, `vendor-registration-reminder`, `notify-vendor-event`) compare that token byte-for-byte against their own `SUPABASE_SERVICE_ROLE_KEY` environment value and return 401 on mismatch.

Vault contents can't be read through the query tool, so the stored value can't be printed for comparison. But the evidence is conclusive: correct schedule, correct URLs, blanket 401 on the one auth path that depends on that secret.

### 1. The trigger path is affected too — and it is worse

`notify_new_service_request` (on `service_requests`) and `notify_first_message` (on `messages`) both build their Authorization header from the same vault secret and call `notify-vendor-event` / `notify-first-message` via `net.http_post`. Both wrap the call in `EXCEPTION WHEN OTHERS THEN NULL`, and `net.http_post` is fire-and-forget, so a 401 is silently swallowed and never surfaces. These are the calls that fire on real quote requests, so they have been failing invisibly alongside the crons. Verifying them is part of the fix, not an afterthought.

### 2. Transactional email uses the same secret but is NOT down

`email_queue_dispatch` and `email_queue_wake` do read the same `email_queue_service_role_key`. However `process-email-queue` authenticates differently: it only checks that the bearer token carries a `service_role` claim, rather than matching the raw string. Emails are still going out — the most recent `sent` row in the email log is today at 05:00 UTC. So the stored secret is still a *valid* service-role credential; it is simply no longer the *same string* as the current `SUPABASE_SERVICE_ROLE_KEY` the SMS functions compare against (likely a legacy vs current key format). Email is unaffected; only the strict-equality SMS functions break.

### 4. Permanently missed notifications

Service requests created since 8 Aug with no matching `new_service_request*` row in the SMS log: **1**. There is no queue behind these calls, so nothing replays automatically — that one vendor would need contacting manually. The exact request, vendor, and phone number will be listed when the fix runs.

## Fix (on approval)

1. Re-bind the backend service credentials so the current service role key is known to the environment.
2. Overwrite the vault secret `email_queue_service_role_key` with that exact current key (update in place via the existing `vault_update_email_queue_key` function — no cron or trigger changes needed).
3. Verify both callers:
   - **Cron caller:** trigger `notification-digest` and `vendor-response-nudge` manually and confirm 200 instead of 401.
   - **Trigger caller:** create a real end-to-end test service request against a test vendor and confirm a `new_service_request` row lands in `sms_notification_log` with a real provider response ("Accepted for delivery"), i.e. the SMS actually reaches the vendor. Clean up the test request afterwards.
4. Re-check the `quote_sent` path: today's `quote_sent` log row has an empty provider response, meaning the send path was entered but the provider never confirmed. Confirm it produces a real provider response once the key matches; if not, diagnose separately.
5. Report the missed-notification list (currently 1 service request) with vendor name and phone so you can contact them manually.

No frontend or edge function code changes are expected — this is a credential mismatch, not a logic bug.
