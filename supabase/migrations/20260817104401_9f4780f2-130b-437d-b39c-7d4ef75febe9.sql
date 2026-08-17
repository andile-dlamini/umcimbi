CREATE OR REPLACE FUNCTION public.get_stalled_conversations(hours_threshold integer DEFAULT 2)
 RETURNS TABLE(conversation_id uuid, vendor_id uuid, vendor_name text, vendor_phone text, planner_name text, event_name text, event_type text, last_message_at timestamp with time zone, hours_since_reply numeric, last_message_preview text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    AND COALESCE(v.is_demo, false) = false
    AND COALESCE(p.is_demo, false) = false
    AND NOT public.has_role(c.user_id, 'admin'::app_role)
    AND (c.admin_stalled_dismissed_at IS NULL OR c.admin_stalled_dismissed_at < c.last_message_at)
    AND public.has_role(auth.uid(), 'admin'::app_role)
  ORDER BY c.last_message_at ASC;
$function$;