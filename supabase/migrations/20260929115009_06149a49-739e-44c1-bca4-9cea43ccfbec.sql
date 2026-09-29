-- Organiser activation nudge (funnel leak #1: signup -> first action).
--
-- Context: of ~115 real organisers, more than half never search and never
-- create a ceremony. This adds the selection query for a 24h SMS nudge.
--
-- The "real organiser" definition below is copied verbatim from
-- get_admin_activation_stats() so the nudge targets exactly the same
-- population the admin dashboard counts. If that definition changes,
-- change it in both places.
--
-- Dormancy = none of the four things we can actually observe:
--   1. no ceremony       (events.owner_user_id)
--   2. no chat           (conversations.user_id)
--   3. no quote request  (service_requests.requester_user_id)
--   4. no search         (platform_events search_performed / search_zero_results)
--
-- Note on chat: we check conversations, NOT messages. Opening a conversation
-- without typing still means the organiser reached a vendor, so they are not
-- dormant. There is no chat_messages table in this schema.
--
-- Backfill window: 60 days (2 months), per product decision.
--
-- KNOWN BLIND SPOT: search_performed only fires once a filter is applied in
-- VendorsList.tsx — it does NOT fire on a bare vendor-list page view. So an
-- organiser who browsed the unfiltered list and left still looks dormant here.
-- The SMS copy is worded to tolerate that (it asks "still looking?" rather
-- than asserting inactivity). Closing this properly needs a list-view event.

CREATE OR REPLACE FUNCTION public.get_dormant_organisers(
  _min_age_hours integer DEFAULT 24,
  _max_age_days integer DEFAULT 60,
  _limit integer DEFAULT 50
)
RETURNS TABLE (
  user_id uuid,
  first_name text,
  full_name text,
  phone_number text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.first_name,
    p.full_name,
    p.phone_number,
    p.created_at
  FROM public.profiles p
  WHERE p.is_demo = false
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = p.user_id AND ur.role = 'user'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = p.user_id AND ur.role IN ('vendor','admin')
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.vendors v WHERE v.owner_user_id = p.user_id
    )
    AND p.created_at IS NOT NULL
    AND p.created_at < now() - make_interval(hours => _min_age_hours)
    AND p.created_at > now() - make_interval(days => _max_age_days)
    AND p.phone_number IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.events e WHERE e.owner_user_id = p.user_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.conversations c WHERE c.user_id = p.user_id
    )
    -- Redundant today (service_requests.event_id is NOT NULL, so anyone with a
    -- request necessarily has an event and is already excluded above) but kept
    -- explicit: a quote request is the strongest possible proof of activity and
    -- should never depend on an FK chain staying NOT NULL.
    AND NOT EXISTS (
      SELECT 1 FROM public.service_requests sr WHERE sr.requester_user_id = p.user_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.platform_events pe
      WHERE pe.actor_id = p.user_id
        AND pe.event_type IN ('search_performed', 'search_zero_results')
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.sms_notification_log l
      WHERE l.user_id = p.user_id
        AND l.event_type = 'activation_nudge_24h'
    )
  ORDER BY p.created_at DESC
  LIMIT _limit;
$$;

REVOKE ALL ON FUNCTION public.get_dormant_organisers(integer, integer, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dormant_organisers(integer, integer, integer) TO service_role;

COMMENT ON FUNCTION public.get_dormant_organisers IS
  'Selects real organisers who signed up more than _min_age_hours ago (within a 60-day backfill window) and have no ceremony, no conversation, no quote request and no search event. Used by the organiser-activation-nudge edge function. Batch-limited so a first run does not SMS the entire dormant backlog at once.';

-- Cron: organiser-activation-nudge
-- Hourly, but ONLY between 08:00 and 19:00 SAST (= 06:00-17:00 UTC).
DO $$
BEGIN
  PERFORM cron.unschedule('organiser-activation-nudge');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'organiser-activation-nudge',
  '0 6-17 * * *',
  $cron$
    SELECT net.http_post(
      url := 'https://pnnckeqrzjglcwkyzzxg.supabase.co/functions/v1/organiser-activation-nudge',
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