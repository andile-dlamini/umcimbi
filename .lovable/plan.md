# Reconcile Tier 2 cron drift into git

## Goal
Close the gap between the live database and the repo for the two Tier 2 SMS cron jobs, and leave an in-repo record that the `email_queue_service_role_key` vault secret was rotated today. No function code, table, or RLS change.

## What's currently live (confirmed via query)

| Job | Schedule | Endpoint |
|---|---|---|
| `vendor-response-nudge` | `0 * * * *` | `functions/v1/vendor-response-nudge` |
| `notification-digest` | `*/30 * * * *` | `functions/v1/notification-digest` |

Both call `net.http_post` with `body := '{}'::jsonb` and an `Authorization: Bearer <service-role>` header. The live commands currently have the rotated service-role key **inlined as a literal** in the cron command text.

## Decision point on the Authorization header

Committing the live command verbatim would put the rotated service-role JWT into git — exactly what you asked to avoid. Two options; both keep the schedule/endpoint/body identical:

- **A. Vault lookup at execution time (recommended).** Change the header to `'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key')`, matching the pattern already used by `email_queue_dispatch`, `notify_new_service_request`, and `notify_first_message`. Migration text carries no secret, and future vault rotations are picked up automatically without another cron rewrite.
- **B. Literal token, kept out of git.** Keep the raw JWT in the live cron command and commit a migration that intentionally omits the header. This drifts again the moment the file is applied to a fresh clone.

Plan below assumes **Option A**. If you'd rather I preserve the literal-token form, say so and I'll adjust.

## New migration

Create `supabase/migrations/<timestamp>_reconcile_tier2_cron.sql` with this structure for **each** job:

```sql
DO $$
BEGIN
  PERFORM cron.unschedule('vendor-response-nudge');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'vendor-response-nudge',
  '0 * * * *',
  $cron$
    SELECT net.http_post(
      url := 'https://pnnckeqrzjglcwkyzzxg.supabase.co/functions/v1/vendor-response-nudge',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret FROM vault.decrypted_secrets
          WHERE name = 'email_queue_service_role_key'
        )
      ),
      body := '{}'::jsonb
    );
  $cron$
);
```

Repeat the same block for `notification-digest` with schedule `*/30 * * * *` and its URL. A leading comment documents the vault-rotation note (name only, no value).

Migration is re-run safe: the `DO ... EXCEPTION WHEN OTHERS THEN NULL` wraps `cron.unschedule` so it's a no-op when the job is absent, then `cron.schedule` reinstalls it.

## Applying to the live DB

Run the same migration against the live database in the same call so the live cron commands switch from the inlined literal JWT to the vault-lookup form. After that, git and live match, and the rotated secret exists only in vault.

## Vault rotation record (not committed as a value)

- **Secret name:** `email_queue_service_role_key`
- **Rotated:** 2026-07-15, to match the current `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** intentionally not stored in git; readable at runtime via `vault.decrypted_secrets`

I'll include this as a comment header inside the migration so a fresh clone sees the note.

## Going-forward rule (acknowledged)

For any future fix that schedules/reschedules a cron job, rotates a secret, or otherwise mutates DB state not captured by a source file, I will write the equivalent SQL into a migration in the same turn — with vault values referenced by name, never inlined — even when the change is also applied directly to keep the incident moving.

## Out of scope
No edits to `notify-first-message`, `notify-vendor-event`, `vendor-response-nudge`, `notification-digest`, `process-email-queue`, `smsTemplates.ts`, tables, or RLS.