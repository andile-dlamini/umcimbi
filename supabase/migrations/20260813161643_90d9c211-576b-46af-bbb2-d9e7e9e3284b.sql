-- escrow-auto-release carried a hardcoded anon JWT in its cron command, so every
-- run since deployment returned 401 from release-escrow and no funds were ever
-- auto-released. Reschedule it to read the service role key from the vault, the
-- same pattern every other cron job uses, so a key rotation cannot break payouts.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'escrow-auto-release') THEN
    PERFORM cron.unschedule('escrow-auto-release');
  END IF;
END $$;

SELECT cron.schedule(
  'escrow-auto-release',
  '*/15 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://pnnckeqrzjglcwkyzzxg.supabase.co/functions/v1/release-escrow',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets
        WHERE name = 'email_queue_service_role_key' LIMIT 1
      )
    ),
    body := '{"mode":"auto"}'::jsonb
  );
  $cron$
);