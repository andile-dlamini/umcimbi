UPDATE storage.buckets SET public = false WHERE id = 'delivery-proofs';

DROP POLICY IF EXISTS "Public can read delivery proofs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload delivery proofs" ON storage.objects;

CREATE POLICY "Booking vendor can upload delivery proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'delivery-proofs'
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.vendors v ON v.id = b.vendor_id
    WHERE b.id::text = (storage.foldername(name))[1]
    AND v.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Booking participants can read delivery proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'delivery-proofs'
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id::text = (storage.foldername(name))[1]
    AND (
      b.client_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = b.vendor_id AND v.owner_user_id = auth.uid())
    )
  )
);