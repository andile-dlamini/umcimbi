-- Allow admins to view all bookings (needed for dispute management)
CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update all bookings (needed for dispute resolution)
CREATE POLICY "Admins can update all bookings"
ON public.bookings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));