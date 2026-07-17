
CREATE POLICY "Admins can upload vendor images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'vendor-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update vendor images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'vendor-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete vendor images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'vendor-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
