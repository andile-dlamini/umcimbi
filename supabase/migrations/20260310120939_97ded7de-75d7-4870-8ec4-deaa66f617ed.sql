CREATE POLICY "Vendors can view events linked to their conversations"
ON public.events
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN vendors v ON v.id = c.vendor_id
    WHERE c.event_id = events.id
    AND v.owner_user_id = auth.uid()
  )
)