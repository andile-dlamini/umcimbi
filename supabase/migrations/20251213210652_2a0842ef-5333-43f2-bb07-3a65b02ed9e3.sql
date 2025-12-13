-- Fix vendor-images bucket RLS policies
DROP POLICY IF EXISTS "Anyone can view vendor images" ON storage.objects;
DROP POLICY IF EXISTS "Vendor owners can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Vendor owners can update images" ON storage.objects;
DROP POLICY IF EXISTS "Vendor owners can delete images" ON storage.objects;

-- Recreate policies for vendor-images bucket
CREATE POLICY "Public can view vendor images"
ON storage.objects FOR SELECT
USING (bucket_id = 'vendor-images');

CREATE POLICY "Authenticated users can upload vendor images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vendor-images');

CREATE POLICY "Authenticated users can update vendor images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'vendor-images');

CREATE POLICY "Authenticated users can delete vendor images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vendor-images');