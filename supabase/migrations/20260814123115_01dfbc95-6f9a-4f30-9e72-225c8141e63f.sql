ALTER TABLE public.vendors
ADD COLUMN additional_categories public.vendor_category[] NOT NULL DEFAULT '{}';

CREATE INDEX idx_vendors_additional_categories ON public.vendors USING GIN(additional_categories);

ALTER TABLE public.vendors
ADD CONSTRAINT chk_vendors_no_duplicate_category
CHECK (NOT (category = ANY(additional_categories)));

CREATE OR REPLACE VIEW public.vendors_directory_public
WITH (security_invoker = off) AS
SELECT id,
       name,
       category,
       location,
       city,
       state_province,
       image_urls,
       logo_url,
       rating,
       review_count,
       is_super_vendor,
       business_verification_status,
       is_active,
       about,
       additional_categories
FROM public.vendors
WHERE is_active = true AND public.is_province_live(state_province);

GRANT SELECT ON public.vendors_directory_public TO anon, authenticated;

CREATE OR REPLACE VIEW public.vendors_marketplace
WITH (security_invoker = off) AS
SELECT id,
       owner_user_id,
       name,
       category,
       location,
       about,
       price_range_text,
       whatsapp_number,
       phone_number,
       email,
       website_url,
       languages,
       rating,
       review_count,
       view_count,
       added_to_events_count,
       is_active,
       image_urls,
       created_at,
       updated_at,
       latitude,
       longitude,
       address_line_1,
       address_line_2,
       city,
       state_province,
       country,
       postal_code,
       vendor_business_type,
       business_verification_status,
       registered_business_name,
       is_super_vendor,
       super_vendor_awarded_at,
       super_vendor_reason,
       verification_reviewed_at,
       verification_reviewed_by,
       logo_url,
       show_registration_on_pdf,
       show_vat_on_pdf,
       letterhead_enabled,
       jobs_completed,
       signup_source,
       payout_method,
       bank_name,
       instagram_url,
       tiktok_url,
       facebook_url,
       is_demo,
       trust_score,
       trust_score_breakdown,
       vendor_tier,
       vendor_tier_override,
       avg_response_time_minutes,
       trust_score_calculated_at,
       is_banned,
       selfie_request_sent_at,
       dormant_nudge_count,
       last_nudge_sent_at,
       last_notified_at,
       additional_categories
FROM public.vendors
WHERE is_active = true AND public.is_province_live(state_province);

REVOKE ALL ON public.vendors_marketplace FROM anon;
GRANT SELECT ON public.vendors_marketplace TO authenticated;

COMMENT ON VIEW public.vendors_marketplace IS 'Curated marketplace view of active vendors in live provinces. Excludes sensitive banking/registration/admin columns but includes additional service categories for discoverability.';