CREATE OR REPLACE VIEW public.vendors_directory_public
WITH (security_invoker = off) AS
SELECT
  id, name, category, location, city, state_province,
  image_urls, logo_url, rating, review_count,
  is_super_vendor, business_verification_status, is_active,
  about
FROM public.vendors
WHERE is_active = true AND public.is_province_live(state_province);

GRANT SELECT ON public.vendors_directory_public TO anon, authenticated;