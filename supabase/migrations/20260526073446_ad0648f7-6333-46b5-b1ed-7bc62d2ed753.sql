DO $$
DECLARE req_id bigint;
BEGIN
  SELECT net.http_post(
    url := 'https://pnnckeqrzjglcwkyzzxg.supabase.co/functions/v1/admin-daily-brief',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1)
    ),
    body := jsonb_build_object('manual_trigger', true, 'triggered_at', now())
  ) INTO req_id;
  RAISE NOTICE 'request_id: %', req_id;
END $$;