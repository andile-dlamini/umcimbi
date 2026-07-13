
-- ============================================================
-- 1. sms_notification_log
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sms_notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('vendor','planner')),
  event_type text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('tier1','tier2','suppressed')),
  related_id uuid,
  phone_number text,
  provider_response text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS sms_notification_log_dedup_idx
  ON public.sms_notification_log (user_id, event_type, COALESCE(related_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE INDEX IF NOT EXISTS sms_notification_log_user_idx
  ON public.sms_notification_log (user_id, sent_at DESC);

GRANT SELECT ON public.sms_notification_log TO authenticated;
GRANT ALL ON public.sms_notification_log TO service_role;

ALTER TABLE public.sms_notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read sms log"
  ON public.sms_notification_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================================
-- 2. notification_preferences
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sms_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification prefs"
  ON public.notification_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. vendors & profiles: watermark / dormancy columns
-- ============================================================
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS dormant_nudge_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_nudge_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_notified_at timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_notified_at timestamptz;

-- ============================================================
-- 4. Helper functions
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_vendor_last_sign_in(_vendor_id uuid)
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.last_sign_in_at
  FROM public.vendors v
  JOIN auth.users u ON u.id = v.owner_user_id
  WHERE v.id = _vendor_id;
$$;

REVOKE ALL ON FUNCTION public.get_vendor_last_sign_in(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_vendor_last_sign_in(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.reset_own_vendor_dormancy()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.vendors
  SET dormant_nudge_count = 0,
      last_nudge_sent_at = NULL
  WHERE owner_user_id = auth.uid()
    AND (dormant_nudge_count > 0 OR last_nudge_sent_at IS NOT NULL);
$$;

GRANT EXECUTE ON FUNCTION public.reset_own_vendor_dormancy() TO authenticated;

-- ============================================================
-- 5. Triggers: service_requests → notify vendor
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_new_service_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    PERFORM net.http_post(
      url := 'https://pnnckeqrzjglcwkyzzxg.supabase.co/functions/v1/notify-vendor-event',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1
        )
      ),
      body := jsonb_build_object(
        'event_type', 'new_service_request',
        'service_request_id', NEW.id
      )
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_service_request ON public.service_requests;
CREATE TRIGGER trg_notify_new_service_request
  AFTER INSERT ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_service_request();

-- ============================================================
-- 6. Trigger: first non-system message → notify recipient
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_first_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_count int;
BEGIN
  IF NEW.sender_type = 'system' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO existing_count
  FROM public.messages
  WHERE conversation_id = NEW.conversation_id
    AND sender_type IN ('user','vendor')
    AND id <> NEW.id;

  IF existing_count > 0 THEN
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := 'https://pnnckeqrzjglcwkyzzxg.supabase.co/functions/v1/notify-first-message',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1
        )
      ),
      body := jsonb_build_object(
        'message_id', NEW.id,
        'conversation_id', NEW.conversation_id,
        'sender_type', NEW.sender_type
      )
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_first_message ON public.messages;
CREATE TRIGGER trg_notify_first_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_first_message();

-- ============================================================
-- 7. Cron jobs
-- ============================================================
DO $$ BEGIN
  PERFORM cron.unschedule('vendor-response-nudge');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  PERFORM cron.unschedule('notification-digest');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'vendor-response-nudge',
  '0 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://pnnckeqrzjglcwkyzzxg.supabase.co/functions/v1/vendor-response-nudge',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1
      )
    ),
    body := '{}'::jsonb
  );
  $cron$
);

SELECT cron.schedule(
  'notification-digest',
  '*/30 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://pnnckeqrzjglcwkyzzxg.supabase.co/functions/v1/notification-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1
      )
    ),
    body := '{}'::jsonb
  );
  $cron$
);
