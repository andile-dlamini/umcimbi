CREATE OR REPLACE FUNCTION public.post_review_prompt_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  IF NEW.booking_status = 'completed' AND (TG_OP = 'INSERT' OR OLD.booking_status IS DISTINCT FROM 'completed') THEN
    SELECT c.id INTO v_conversation_id
    FROM public.conversations c
    WHERE c.user_id = NEW.client_id
      AND c.vendor_id = NEW.vendor_id
    ORDER BY (c.event_id = NEW.event_id) DESC, c.last_message_at DESC NULLS LAST
    LIMIT 1;

    IF v_conversation_id IS NULL THEN
      RETURN NEW;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.conversation_id = v_conversation_id
        AND m.message_type = 'review_prompt'
        AND m.metadata->>'booking_id' = NEW.id::text
    ) THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.messages (conversation_id, sender_type, sender_user_id, content, message_type, metadata)
    VALUES (
      v_conversation_id,
      'system',
      NULL,
      'This booking is complete. Share your experience — your review helps the community.',
      'review_prompt',
      jsonb_build_object('booking_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_review_prompt ON public.bookings;
CREATE TRIGGER trg_post_review_prompt
AFTER INSERT OR UPDATE OF booking_status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.post_review_prompt_on_completion();

-- Back-fill for existing completed bookings
INSERT INTO public.messages (conversation_id, sender_type, sender_user_id, content, message_type, metadata)
SELECT c.id,
       'system',
       NULL,
       'This booking is complete. Share your experience — your review helps the community.',
       'review_prompt',
       jsonb_build_object('booking_id', b.id)
FROM public.bookings b
JOIN LATERAL (
  SELECT c.id
  FROM public.conversations c
  WHERE c.user_id = b.client_id AND c.vendor_id = b.vendor_id
  ORDER BY (c.event_id = b.event_id) DESC, c.last_message_at DESC NULLS LAST
  LIMIT 1
) c ON true
WHERE b.booking_status = 'completed'
  AND NOT EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.conversation_id = c.id
      AND m.message_type = 'review_prompt'
      AND m.metadata->>'booking_id' = b.id::text
  );