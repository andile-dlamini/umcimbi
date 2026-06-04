-- 1. Raise the image cap from 5 to 15
CREATE OR REPLACE FUNCTION public.limit_vendor_images()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF array_length(NEW.image_urls, 1) > 15 THEN
    NEW.image_urls := NEW.image_urls[1:15];
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Add social link columns to vendors
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS tiktok_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text;

-- 3. Create saved_vendors table
CREATE TABLE IF NOT EXISTS public.saved_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, vendor_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_vendors TO authenticated;
GRANT ALL ON public.saved_vendors TO service_role;

ALTER TABLE public.saved_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved vendors"
ON public.saved_vendors
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_vendors_user ON public.saved_vendors(user_id);