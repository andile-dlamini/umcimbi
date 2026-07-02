
CREATE OR REPLACE FUNCTION public.get_stalled_conversations(hours_threshold int DEFAULT 2)
RETURNS TABLE (
  conversation_id uuid,
  vendor_id uuid,
  vendor_name text,
  vendor_phone text,
  planner_name text,
  event_name text,
  event_type text,
  last_message_at timestamptz,
  hours_since_reply numeric,
  last_message_preview text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    c.id,
    v.id,
    v.name,
    v.phone_number,
    p.full_name,
    e.name,
    e.type::text,
    c.last_message_at,
    ROUND(EXTRACT(EPOCH FROM (now() - c.last_message_at)) / 3600, 1),
    m.content
  FROM public.conversations c
  JOIN public.vendors v ON v.id = c.vendor_id
  LEFT JOIN public.profiles p ON p.user_id = c.user_id
  LEFT JOIN public.events e ON e.id = c.event_id
  JOIN LATERAL (
    SELECT content, sender_type
    FROM public.messages
    WHERE conversation_id = c.id
    ORDER BY created_at DESC
    LIMIT 1
  ) m ON true
  WHERE m.sender_type = 'user'
    AND c.last_message_at < now() - (hours_threshold || ' hours')::interval
    AND public.has_role(auth.uid(), 'admin'::app_role)
  ORDER BY c.last_message_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_stalled_conversations(int) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_ceremony_pipeline()
RETURNS TABLE (
  event_id uuid,
  event_name text,
  event_type text,
  event_date date,
  requests_sent bigint,
  quotes_received bigint,
  has_booking boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
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
  GROUP BY e.id
  ORDER BY e.date ASC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.get_ceremony_pipeline() TO authenticated;
