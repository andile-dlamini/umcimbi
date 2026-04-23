DROP POLICY IF EXISTS "Email assets are publicly accessible" ON storage.objects;

CREATE POLICY "UMCIMBI email logo is publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'email-assets' AND name = 'umcimbi-logo.png');