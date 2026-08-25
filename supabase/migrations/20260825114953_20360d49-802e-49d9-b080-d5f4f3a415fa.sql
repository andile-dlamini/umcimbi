CREATE OR REPLACE FUNCTION public.get_ceremony_pipeline()
RETURNS TABLE(event_id uuid, event_name text, event_type text, event_date date, requests_sent bigint, quotes_received bigint, has_booking boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.id,
    e.name,
    e.type::text,
    e.date,
    COUNT(DISTINCT sr.id),
    COUNT(DISTINCT q.id),
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.event_id = e.id
        AND b.booking_status IN ('confirmed', 'completed', 'disputed')
    )
  FROM public.events e
  LEFT JOIN public.service_requests sr ON sr.event_id = e.id
  LEFT JOIN public.quotes q ON q.request_id = sr.id
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = e.owner_user_id AND p.is_demo = true
    )
    AND NOT public.has_role(e.owner_user_id, 'admin'::app_role)
  GROUP BY e.id
  ORDER BY e.date ASC NULLS LAST;
$$;