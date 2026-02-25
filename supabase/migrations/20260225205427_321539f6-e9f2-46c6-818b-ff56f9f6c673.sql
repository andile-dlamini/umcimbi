
-- 1. Time-limit vendor access to customer profiles
-- Drop the existing overly-broad policy
DROP POLICY IF EXISTS "Vendors can view profiles of users who requested their services" ON public.profiles;

-- Replace with time-limited policy: only active requests or requests updated in last 90 days
CREATE POLICY "Vendors can view profiles for active requests"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.service_requests sr
    JOIN public.vendors v ON v.id = sr.vendor_id
    WHERE sr.requester_user_id = profiles.user_id
      AND v.owner_user_id = auth.uid()
      AND (
        sr.status IN ('pending', 'quoted', 'accepted')
        OR sr.updated_at > now() - interval '90 days'
      )
  )
);

-- 2. Create a public view for vendors that hides sensitive business PII
CREATE OR REPLACE VIEW public.vendors_public
WITH (security_invoker = on) AS
SELECT
  id, owner_user_id, name, category, location, latitude, longitude,
  address_line_1, address_line_2, city, state_province, country, postal_code,
  about, price_range_text, whatsapp_number, phone_number, email, website_url,
  languages, rating, review_count, view_count, added_to_events_count,
  is_active, image_urls, vendor_business_type, business_verification_status,
  is_super_vendor, super_vendor_awarded_at, super_vendor_reason,
  logo_url, letterhead_enabled, show_registration_on_pdf, show_vat_on_pdf,
  created_at, updated_at
FROM public.vendors;
-- Excludes: registration_number, vat_number, registered_business_name,
--           verification_reviewed_at, verification_reviewed_by

-- 3. Replace the overly-broad public SELECT policy on vendors
-- Keep owner and admin policies, but restrict the public one
DROP POLICY IF EXISTS "Vendors are viewable by everyone" ON public.vendors;

-- Public users can only read via the view (which invokes RLS).
-- We need a policy that allows SELECT for active vendors but only non-sensitive columns
-- Since RLS can't filter columns, we restrict the base table to authenticated + owner/admin
-- and let the public view handle anonymous/public access.
-- Re-add a restrictive public policy: only active vendors visible to authenticated users
CREATE POLICY "Active vendors viewable by authenticated users"
ON public.vendors
FOR SELECT
TO authenticated
USING (is_active = true);
