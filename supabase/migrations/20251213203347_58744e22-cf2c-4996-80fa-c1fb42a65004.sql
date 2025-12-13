-- Add main_image_url column to vendors table (if not using first element of image_urls)
-- The vendors table already has image_urls array, so we'll use:
-- - image_urls[0] as main image
-- - image_urls[1-5] as gallery (max 5 images total)

-- Add notifications_enabled and language preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT true;

-- Note: preferred_language already exists in profiles table

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_notifications ON public.profiles(notifications_enabled);

-- Create a trigger to limit vendor images to max 5
CREATE OR REPLACE FUNCTION public.limit_vendor_images()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF array_length(NEW.image_urls, 1) > 5 THEN
    NEW.image_urls := NEW.image_urls[1:5];
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS limit_vendor_images_trigger ON public.vendors;
CREATE TRIGGER limit_vendor_images_trigger
BEFORE INSERT OR UPDATE ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.limit_vendor_images();