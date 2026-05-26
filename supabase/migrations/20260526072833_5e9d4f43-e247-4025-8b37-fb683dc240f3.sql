CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

DO $$ BEGIN
  PERFORM cron.unschedule('admin-daily-brief');
EXCEPTION WHEN others THEN NULL;
END $$;

SELECT cron.schedule(
  'admin-daily-brief',
  '0 6 * * *',
  $$
  SELECT extensions.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/admin-daily-brief',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);