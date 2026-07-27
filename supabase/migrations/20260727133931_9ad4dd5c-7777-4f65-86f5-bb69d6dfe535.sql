DO $$
BEGIN
  PERFORM cron.unschedule('vendor-registration-reminder');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'vendor-registration-reminder',
  '0 * * * *',
  $cron$
    SELECT net.http_post(
      url := 'https://pnnckeqrzjglcwkyzzxg.supabase.co/functions/v1/vendor-registration-reminder',
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