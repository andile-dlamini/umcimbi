-- 1. Duplicate payment-proof upload policy (already dropped live; recorded for git)
DROP POLICY IF EXISTS "Clients can upload own payment proofs" ON storage.objects;

-- 2. Trust score: admin / service role / cron only
ALTER FUNCTION public.calculate_vendor_trust_score(uuid) RENAME TO calculate_vendor_trust_score_core;
REVOKE ALL ON FUNCTION public.calculate_vendor_trust_score_core(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_vendor_trust_score_core(uuid) TO service_role;

CREATE FUNCTION public.calculate_vendor_trust_score(p_vendor_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF coalesce(auth.role(), '') IN ('anon', 'authenticated')
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not authorised' USING ERRCODE = '42501';
  END IF;
  PERFORM public.calculate_vendor_trust_score_core(p_vendor_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_all_trust_scores()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_vendor_id uuid;
BEGIN
  IF coalesce(auth.role(), '') IN ('anon', 'authenticated')
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Not authorised' USING ERRCODE = '42501';
  END IF;
  FOR v_vendor_id IN SELECT id FROM public.vendors WHERE is_active = true AND is_demo = false LOOP
    PERFORM public.calculate_vendor_trust_score_core(v_vendor_id);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.calculate_vendor_trust_score(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.calculate_vendor_trust_score(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.recalculate_all_trust_scores() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recalculate_all_trust_scores() TO authenticated, service_role;

-- 3. Marketplace view: remove internal/banking/admin columns, read-only for signed-in users
DROP VIEW public.vendors_marketplace;
CREATE VIEW public.vendors_marketplace WITH (security_invoker = off) AS
SELECT id, owner_user_id, name, category, location, about, price_range_text,
       whatsapp_number, phone_number, email, website_url, languages,
       rating, review_count, view_count, added_to_events_count, is_active, image_urls,
       created_at, updated_at, latitude, longitude,
       address_line_1, address_line_2, city, state_province, country, postal_code,
       vendor_business_type, business_verification_status, registered_business_name,
       is_super_vendor, super_vendor_awarded_at, super_vendor_reason,
       logo_url, show_registration_on_pdf, show_vat_on_pdf, letterhead_enabled,
       jobs_completed, instagram_url, tiktok_url, facebook_url, is_demo,
       trust_score, vendor_tier, avg_response_time_minutes, additional_categories
FROM public.vendors
WHERE is_active = true AND public.is_province_live(state_province);
REVOKE ALL ON public.vendors_marketplace FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.vendors_marketplace TO authenticated, service_role;
COMMENT ON VIEW public.vendors_marketplace IS 'Read-only marketplace view of active vendors in live provinces. Excludes banking, admin, verification-review and nudge columns. Owner-level access is intentional; never grant write privileges.';

-- 4. vendors_public: unused by app and edge functions
REVOKE ALL ON public.vendors_public FROM PUBLIC, anon, authenticated;

NOTIFY pgrst, 'reload schema';