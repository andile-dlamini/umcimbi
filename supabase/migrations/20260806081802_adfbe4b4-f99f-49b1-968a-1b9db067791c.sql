CREATE OR REPLACE FUNCTION public.get_admin_user_registration_stats()
RETURNS TABLE (
  total_vendors bigint,
  vendors_joined_this_month bigint,
  total_organisers bigint,
  organisers_joined_this_month bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (
      SELECT count(*) FROM public.vendors v
      WHERE v.owner_user_id IS NOT NULL
        AND v.is_demo = false
        AND v.is_banned = false
    ),
    (
      SELECT count(*) FROM public.vendors v
      WHERE v.owner_user_id IS NOT NULL
        AND v.is_demo = false
        AND v.is_banned = false
        AND v.created_at >= (date_trunc('month', (now() AT TIME ZONE 'Africa/Johannesburg')) AT TIME ZONE 'Africa/Johannesburg')
    ),
    (
      SELECT count(DISTINCT p.user_id) FROM public.profiles p
      WHERE p.is_demo = false
        AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id AND ur.role = 'user')
        AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id AND ur.role IN ('vendor','admin'))
        AND NOT EXISTS (SELECT 1 FROM public.vendors v WHERE v.owner_user_id = p.user_id)
    ),
    (
      SELECT count(DISTINCT p.user_id) FROM public.profiles p
      WHERE p.is_demo = false
        AND p.created_at >= (date_trunc('month', (now() AT TIME ZONE 'Africa/Johannesburg')) AT TIME ZONE 'Africa/Johannesburg')
        AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id AND ur.role = 'user')
        AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id AND ur.role IN ('vendor','admin'))
        AND NOT EXISTS (SELECT 1 FROM public.vendors v WHERE v.owner_user_id = p.user_id)
    )
  WHERE public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_user_registration_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_activation_stats()
RETURNS TABLE (
  real_vendors bigint,
  vendors_ever_requested bigint,
  vendors_ever_responded bigint,
  vendors_ever_quoted bigint,
  real_organisers bigint,
  organisers_with_ceremony bigint,
  organisers_with_request bigint,
  total_ceremonies bigint,
  ceremonies_with_request bigint,
  requests_awaiting_vendor bigint,
  quotes_awaiting_client bigint,
  median_hours_to_first_response numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH rv AS (
    SELECT v.id, v.owner_user_id FROM public.vendors v
    WHERE v.owner_user_id IS NOT NULL AND v.is_demo = false AND v.is_banned = false
  ),
  ro AS (
    SELECT p.user_id FROM public.profiles p
    WHERE p.is_demo = false
      AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id AND ur.role = 'user')
      AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id AND ur.role IN ('vendor','admin'))
      AND NOT EXISTS (SELECT 1 FROM public.vendors v WHERE v.owner_user_id = p.user_id)
  ),
  re AS (
    SELECT e.id FROM public.events e JOIN ro ON ro.user_id = e.owner_user_id
  )
  SELECT
    (SELECT count(*) FROM rv),
    (SELECT count(DISTINCT sr.vendor_id) FROM public.service_requests sr JOIN rv ON rv.id = sr.vendor_id),
    (SELECT count(DISTINCT sr.vendor_id) FROM public.service_requests sr JOIN rv ON rv.id = sr.vendor_id WHERE sr.responded_at IS NOT NULL),
    (SELECT count(DISTINCT q.vendor_id) FROM public.quotes q JOIN rv ON rv.id = q.vendor_id),
    (SELECT count(*) FROM ro),
    (SELECT count(DISTINCT e.owner_user_id) FROM public.events e JOIN ro ON ro.user_id = e.owner_user_id),
    (SELECT count(DISTINCT sr.requester_user_id) FROM public.service_requests sr JOIN ro ON ro.user_id = sr.requester_user_id),
    (SELECT count(*) FROM re),
    (SELECT count(DISTINCT sr.event_id) FROM public.service_requests sr JOIN re ON re.id = sr.event_id),
    (SELECT count(*) FROM public.service_requests sr
       JOIN rv ON rv.id = sr.vendor_id
       WHERE sr.status = 'pending' AND (sr.expires_at IS NULL OR sr.expires_at > now())),
    (SELECT count(*) FROM public.quotes q
       JOIN rv ON rv.id = q.vendor_id
       WHERE q.status = 'pending_client' AND (q.expires_at IS NULL OR q.expires_at > now())),
    (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM (sr.responded_at - sr.created_at)) / 3600.0)
       FROM public.service_requests sr WHERE sr.responded_at IS NOT NULL)
  WHERE public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_activation_stats() TO authenticated;