DROP POLICY IF EXISTS "Clients can upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Booking participants can view payment proofs files" ON storage.objects;

CREATE POLICY "Clients can upload own payment proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id::text = (storage.foldername(name))[1]
    AND b.client_id = auth.uid()
  )
);

CREATE POLICY "Booking participants can view payment proofs files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id::text = (storage.foldername(name))[1]
      AND (
        b.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.vendors v
          WHERE v.id = b.vendor_id AND v.owner_user_id = auth.uid()
        )
      )
    )
    OR public.has_role(auth.uid(), 'admin')
  )
);