
-- 1. live_provinces config table
CREATE TABLE public.live_provinces (
  province text PRIMARY KEY,
  launched_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.live_provinces TO anon, authenticated;
GRANT ALL ON public.live_provinces TO service_role;

ALTER TABLE public.live_provinces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read live provinces"
ON public.live_provinces FOR SELECT
USING (true);

INSERT INTO public.live_provinces (province) VALUES ('KwaZulu-Natal');

-- Helper function
CREATE OR REPLACE FUNCTION public.is_province_live(p text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.live_provinces WHERE province = p);
$$;

-- 2. Add state_province to events + backfill
ALTER TABLE public.events ADD COLUMN state_province text;
UPDATE public.events SET state_province = 'KwaZulu-Natal' WHERE state_province IS NULL;

-- Backfill vendors state_province
UPDATE public.vendors
SET state_province = 'KwaZulu-Natal'
WHERE state_province IS NULL OR trim(state_province) = '';

-- 3. Vendors SELECT policy — restrict to live provinces
DROP POLICY IF EXISTS "Active vendors viewable by authenticated users" ON public.vendors;

CREATE POLICY "Active vendors in live provinces viewable by authenticated users"
ON public.vendors
FOR SELECT
TO authenticated
USING (is_active = true AND public.is_province_live(state_province));

-- 4. service_requests INSERT policy
DROP POLICY IF EXISTS "Users can create service requests" ON public.service_requests;

CREATE POLICY "Users can create service requests in live provinces"
ON public.service_requests
FOR INSERT
WITH CHECK (
  requester_user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = service_requests.event_id
    AND events.owner_user_id = auth.uid()
    AND public.is_province_live(events.state_province)
  )
);

-- 5. quotes INSERT policy (vendor-created)
DROP POLICY IF EXISTS "Vendors can create quotes for requests to them" ON public.quotes;

CREATE POLICY "Vendors can create quotes in live provinces"
ON public.quotes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.service_requests sr
    JOIN public.vendors v ON v.id = sr.vendor_id
    JOIN public.events e ON e.id = sr.event_id
    WHERE sr.id = request_id
    AND v.owner_user_id = auth.uid()
    AND public.is_province_live(e.state_province)
  )
);

-- 6. messages INSERT policy
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;

CREATE POLICY "Users can insert messages in their conversations"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_user_id AND
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (
      c.user_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = c.vendor_id AND v.owner_user_id = auth.uid())
    )
    AND (
      c.event_id IS NULL OR
      EXISTS (SELECT 1 FROM public.events e WHERE e.id = c.event_id AND public.is_province_live(e.state_province))
    )
  )
);

-- 7. Extend waitlist_signups
ALTER TABLE public.waitlist_signups
  ADD COLUMN province text,
  ADD COLUMN city text,
  ADD COLUMN event_type text;
