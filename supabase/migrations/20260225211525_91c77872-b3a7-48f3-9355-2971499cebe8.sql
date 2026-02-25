
-- Drop the restrictive DELETE policy and recreate as permissive
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;

CREATE POLICY "Users can delete their own events"
ON public.events
FOR DELETE
TO authenticated
USING (auth.uid() = owner_user_id);
