-- STEP 1: Add trust score columns to vendors table
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS trust_score integer,
  ADD COLUMN IF NOT EXISTS trust_score_breakdown jsonb,
  ADD COLUMN IF NOT EXISTS vendor_tier text CHECK (vendor_tier IN ('A', 'B', 'C', 'D')),
  ADD COLUMN IF NOT EXISTS vendor_tier_override boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS avg_response_time_minutes integer,
  ADD COLUMN IF NOT EXISTS trust_score_calculated_at timestamptz;

-- STEP 2: Create the trust score calculation function
CREATE OR REPLACE FUNCTION public.calculate_vendor_trust_score(p_vendor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendor vendors%ROWTYPE;
  v_identity_score integer := 0; v_identity_label text;
  v_response_score integer := 0; v_response_label text;
  v_avg_response_minutes integer; v_enquiry_count integer; v_avg_minutes numeric;
  v_review_score integer := 0; v_review_label text;
  v_avg_rating numeric; v_review_count integer; v_vendor_reviewed_back boolean;
  v_jobs_score integer := 0; v_jobs_label text; v_completed_jobs integer;
  v_dispute_score integer := 0; v_dispute_label text; v_dispute_count integer;
  v_total_score integer := 0; v_tier text; v_breakdown jsonb;
BEGIN
  SELECT * INTO v_vendor FROM public.vendors WHERE id = p_vendor_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF v_vendor.business_verification_status = 'verified' THEN
    v_identity_score := 10; v_identity_label := 'Verified';
  ELSE
    v_identity_score := 0; v_identity_label := 'Not verified';
  END IF;

  SELECT COUNT(DISTINCT c.id) INTO v_enquiry_count
  FROM public.conversations c
  JOIN public.messages m ON m.conversation_id = c.id AND m.sender_type = 'user'
  WHERE c.vendor_id = p_vendor_id;

  IF v_enquiry_count < 5 THEN
    v_response_score := 0;
    v_response_label := 'Insufficient data (fewer than 5 enquiries)';
    v_avg_response_minutes := NULL;
  ELSE
    SELECT AVG(response_gap_minutes) INTO v_avg_minutes FROM (
      SELECT c.id AS conv_id,
        EXTRACT(EPOCH FROM (MIN(vm.created_at) - MIN(um.created_at))) / 60 AS response_gap_minutes
      FROM public.conversations c
      JOIN public.messages um ON um.conversation_id = c.id AND um.sender_type = 'user'
      JOIN public.messages vm ON vm.conversation_id = c.id AND vm.sender_type = 'vendor'
        AND vm.created_at > (SELECT MIN(m2.created_at) FROM public.messages m2 WHERE m2.conversation_id = c.id AND m2.sender_type = 'user')
      WHERE c.vendor_id = p_vendor_id
      GROUP BY c.id
    ) sub WHERE response_gap_minutes > 0;
    v_avg_response_minutes := COALESCE(v_avg_minutes::integer, NULL);
    IF v_avg_minutes IS NULL THEN v_response_score := 0; v_response_label := 'No responses recorded';
    ELSIF v_avg_minutes < 60 THEN v_response_score := 15; v_response_label := 'Excellent (under 1 hour)';
    ELSIF v_avg_minutes < 240 THEN v_response_score := 12; v_response_label := 'Good (1–4 hours)';
    ELSIF v_avg_minutes < 720 THEN v_response_score := 9; v_response_label := 'Fair (4–12 hours)';
    ELSIF v_avg_minutes < 1440 THEN v_response_score := 6; v_response_label := 'Slow (12–24 hours)';
    ELSIF v_avg_minutes < 2880 THEN v_response_score := 3; v_response_label := 'Very slow (24–48 hours)';
    ELSE v_response_score := 0; v_response_label := 'Poor (more than 48 hours)';
    END IF;
  END IF;

  SELECT COUNT(*), AVG(br.rating) INTO v_review_count, v_avg_rating
  FROM public.booking_reviews br
  JOIN public.bookings b ON b.id = br.booking_id
  WHERE b.vendor_id = p_vendor_id AND br.reviewer_type = 'client';

  SELECT EXISTS (
    SELECT 1 FROM public.booking_reviews br JOIN public.bookings b ON b.id = br.booking_id
    WHERE b.vendor_id = p_vendor_id AND br.reviewer_type = 'vendor'
  ) INTO v_vendor_reviewed_back;

  IF v_review_count = 0 THEN
    v_review_score := 0; v_review_label := 'No reviews yet';
  ELSE
    v_review_score := CASE WHEN v_avg_rating >= 4.5 THEN 18 WHEN v_avg_rating >= 4.0 THEN 14 WHEN v_avg_rating >= 3.0 THEN 10 WHEN v_avg_rating >= 2.0 THEN 5 ELSE 0 END;
    IF v_vendor_reviewed_back THEN v_review_score := v_review_score + 7; END IF;
    v_review_score := LEAST(v_review_score, 25);
    v_review_label := ROUND(v_avg_rating, 1)::text || ' avg (' || v_review_count || ' review' || CASE WHEN v_review_count = 1 THEN '' ELSE 's' END || ')';
  END IF;

  v_completed_jobs := COALESCE(v_vendor.jobs_completed, 0);
  v_jobs_score := CASE WHEN v_completed_jobs = 0 THEN 0 WHEN v_completed_jobs = 1 THEN 5 WHEN v_completed_jobs = 2 THEN 8 WHEN v_completed_jobs < 5 THEN 12 WHEN v_completed_jobs < 10 THEN 17 ELSE 25 END;
  v_jobs_label := v_completed_jobs::text || ' completed job' || CASE WHEN v_completed_jobs = 1 THEN '' ELSE 's' END;

  SELECT COUNT(*) INTO v_dispute_count FROM public.bookings WHERE vendor_id = p_vendor_id AND booking_status = 'disputed';
  IF v_completed_jobs = 0 THEN
    v_dispute_score := 0; v_dispute_label := 'No dispute data yet';
  ELSE
    v_dispute_score := CASE WHEN v_dispute_count = 0 THEN 25 WHEN v_dispute_count = 1 THEN 18 WHEN v_dispute_count = 2 THEN 12 WHEN v_dispute_count = 3 THEN 6 ELSE 0 END;
    v_dispute_label := CASE WHEN v_dispute_count = 0 THEN 'No disputes' ELSE v_dispute_count::text || ' dispute' || CASE WHEN v_dispute_count = 1 THEN '' ELSE 's' END END;
  END IF;

  v_total_score := v_identity_score + v_response_score + v_review_score + v_jobs_score + v_dispute_score;

  IF NOT COALESCE(v_vendor.vendor_tier_override, false) THEN
    v_tier := CASE WHEN v_total_score >= 80 THEN 'A' WHEN v_total_score >= 60 THEN 'B' WHEN v_total_score >= 40 THEN 'C' ELSE 'D' END;
  ELSE
    v_tier := v_vendor.vendor_tier;
  END IF;

  v_breakdown := jsonb_build_object(
    'identity', jsonb_build_object('score', v_identity_score, 'max', 10, 'label', v_identity_label),
    'responsiveness', jsonb_build_object('score', v_response_score, 'max', 15, 'label', v_response_label, 'avg_minutes', v_avg_response_minutes, 'enquiry_count', v_enquiry_count),
    'reviews', jsonb_build_object('score', v_review_score, 'max', 25, 'label', v_review_label, 'count', v_review_count, 'avg_rating', ROUND(COALESCE(v_avg_rating, 0)::numeric, 1)),
    'completed_jobs', jsonb_build_object('score', v_jobs_score, 'max', 25, 'label', v_jobs_label, 'count', v_completed_jobs),
    'disputes', jsonb_build_object('score', v_dispute_score, 'max', 25, 'label', v_dispute_label, 'count', v_dispute_count)
  );

  UPDATE public.vendors SET
    trust_score = v_total_score, trust_score_breakdown = v_breakdown,
    avg_response_time_minutes = v_avg_response_minutes, vendor_tier = v_tier,
    trust_score_calculated_at = now()
  WHERE id = p_vendor_id;
END;
$$;

-- STEP 3: Batch recalculation function
CREATE OR REPLACE FUNCTION public.recalculate_all_trust_scores()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_vendor_id uuid;
BEGIN
  FOR v_vendor_id IN SELECT id FROM public.vendors WHERE is_active = true AND is_demo = false LOOP
    PERFORM public.calculate_vendor_trust_score(v_vendor_id);
  END LOOP;
END;
$$;

-- STEP 4: Run initial calculation
SELECT public.recalculate_all_trust_scores();

-- STEP 5: Schedule nightly at 02:00 UTC
DO $$ BEGIN PERFORM cron.unschedule('recalculate-vendor-trust-scores'); EXCEPTION WHEN others THEN NULL; END $$;
SELECT cron.schedule('recalculate-vendor-trust-scores', '0 2 * * *', $$ SELECT public.recalculate_all_trust_scores(); $$);