DROP POLICY IF EXISTS "Authenticated users can upload vendor images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update vendor images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete vendor images" ON storage.objects;

CREATE POLICY "Vendor owner can upload vendor images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-images'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.vendors WHERE owner_user_id = auth.uid()
  )
);

CREATE POLICY "Vendor owner can update vendor images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vendor-images'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.vendors WHERE owner_user_id = auth.uid()
  )
);

CREATE POLICY "Vendor owner can delete vendor images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor-images'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.vendors WHERE owner_user_id = auth.uid()
  )
);