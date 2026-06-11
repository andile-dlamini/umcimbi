
-- 1. Fix delivery-proofs upload policy
DROP POLICY IF EXISTS "Booking vendor can upload delivery proofs" ON storage.objects;
CREATE POLICY "Booking vendor can upload delivery proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'delivery-proofs'
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.vendors v ON v.id = b.vendor_id
    WHERE (b.id)::text = (storage.foldername(objects.name))[1]
      AND v.owner_user_id = auth.uid()
  )
);

-- 2. Fix vendor quote PDF read policy
DROP POLICY IF EXISTS "Vendors can read their quote PDFs" ON storage.objects;
CREATE POLICY "Vendors can read their quote PDFs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'quote-pdfs'
  AND EXISTS (
    SELECT 1 FROM public.quotes q
    JOIN public.vendors v ON v.id = q.vendor_id
    WHERE q.final_offer_pdf_key = objects.name
      AND v.owner_user_id = auth.uid()
  )
);

-- 3. Admin read access for survey_responses
DROP POLICY IF EXISTS "Admins can view survey responses" ON public.survey_responses;
CREATE POLICY "Admins can view survey responses"
ON public.survey_responses FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
