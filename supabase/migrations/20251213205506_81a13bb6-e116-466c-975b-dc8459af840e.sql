-- Create storage bucket for vendor images
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-images', 'vendor-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view vendor images
CREATE POLICY "Vendor images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'vendor-images');

-- Allow vendors to upload their own images
CREATE POLICY "Vendors can upload their images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vendor-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow vendors to delete their own images
CREATE POLICY "Vendors can delete their images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vendor-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow users to upload their own avatar
CREATE POLICY "Users can upload their avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add avatar_url column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url text;