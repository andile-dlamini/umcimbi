DO $$
DECLARE req_id bigint;
BEGIN
  SELECT net.http_post(
    url := 'https://pnnckeqrzjglcwkyzzxg.supabase.co/functions/v1/setup-recording-accounts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubmNrZXFyempnbGN3a3l6enhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNzcxMjAsImV4cCI6MjA4MDg1MzEyMH0.HzvgyP7gUS2fDwQfuuLLhwF_SDKoBgH41AiGUJtHSRE'
    ),
    body := '{}'::jsonb
  ) INTO req_id;
  RAISE NOTICE 'request_id: %', req_id;
END $$;