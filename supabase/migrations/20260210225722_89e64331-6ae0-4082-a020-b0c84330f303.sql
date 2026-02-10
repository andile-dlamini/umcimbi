
-- Add branding PDF toggles and logo to vendors
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS show_registration_on_pdf boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_vat_on_pdf boolean NOT NULL DEFAULT false;

-- Add PDF fields and offer number to quotes
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS offer_number text UNIQUE,
  ADD COLUMN IF NOT EXISTS final_offer_pdf_key text,
  ADD COLUMN IF NOT EXISTS final_offer_pdf_generated_at timestamptz;

-- Create sequence for offer numbers
CREATE SEQUENCE IF NOT EXISTS public.offer_number_seq START WITH 1;

-- Function to generate human-readable offer number
CREATE OR REPLACE FUNCTION public.generate_offer_number()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT 'UMC-Q-' || EXTRACT(YEAR FROM now())::text || '-' || LPAD(nextval('public.offer_number_seq')::text, 6, '0');
$$;

-- Create private bucket for quote PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('quote-pdfs', 'quote-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Clients can read their own quote PDFs
CREATE POLICY "Clients can read their quote PDFs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'quote-pdfs'
  AND EXISTS (
    SELECT 1 FROM public.quotes q
    JOIN public.service_requests sr ON sr.id = q.request_id
    WHERE q.final_offer_pdf_key = name
    AND sr.requester_user_id = auth.uid()
  )
);

-- RLS: Vendors can read their quote PDFs
CREATE POLICY "Vendors can read their quote PDFs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'quote-pdfs'
  AND EXISTS (
    SELECT 1 FROM public.quotes q
    JOIN public.vendors v ON v.id = q.vendor_id
    WHERE q.final_offer_pdf_key = name
    AND v.owner_user_id = auth.uid()
  )
);

-- RLS: Service role can insert PDFs (edge function uses service role)
CREATE POLICY "Service role can upload quote PDFs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'quote-pdfs'
);
