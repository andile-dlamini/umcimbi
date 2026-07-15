-- Reconcile Tier 2 SMS cron jobs into git.
--
-- Vault rotation record (value intentionally NOT committed):
--   secret name : email_queue_service_role_key
--   rotated on  : 2026-07-15 (synced to current SUPABASE_SERVICE_ROLE_KEY)
--   read at run : SELECT decrypted_secret FROM vault.decrypted_secrets
--                 WHERE name = 'email_queue_service_role_key'
--
-- Safe to re-run: unschedule is wrapped in DO/EXCEPTION, then re-scheduled.

-- 1) vendor-response-nudge : hourly
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

-- 2) notification-digest : every 30 minutes
DO $$
BEGIN
  PERFORM cron.unschedule('notification-digest');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'notification-digest',
  '*/30 * * * *',
  $cron$
    SELECT net.http_post(
      url := 'https://pnnckeqrzjglcwkyzzxg.supabase.co/functions/v1/notification-digest',
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