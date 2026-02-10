
-- Enums
CREATE TYPE public.vendor_business_type AS ENUM ('independent', 'registered_business');
CREATE TYPE public.business_verification_status AS ENUM ('not_applicable', 'pending', 'verified', 'rejected');
CREATE TYPE public.verification_doc_type AS ENUM ('cipc_registration', 'proof_of_address', 'bank_confirmation', 'vat_certificate', 'other');
CREATE TYPE public.verification_doc_status AS ENUM ('uploaded', 'approved', 'rejected');

-- Add columns to vendors
ALTER TABLE public.vendors
  ADD COLUMN vendor_business_type public.vendor_business_type NOT NULL DEFAULT 'independent',
  ADD COLUMN business_verification_status public.business_verification_status NOT NULL DEFAULT 'not_applicable',
  ADD COLUMN registered_business_name text,
  ADD COLUMN registration_number text,
  ADD COLUMN vat_number text,
  ADD COLUMN is_super_vendor boolean NOT NULL DEFAULT false,
  ADD COLUMN super_vendor_awarded_at timestamptz,
  ADD COLUMN super_vendor_reason text,
  ADD COLUMN verification_reviewed_at timestamptz,
  ADD COLUMN verification_reviewed_by uuid;

-- Verification documents table
CREATE TABLE public.vendor_verification_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  doc_type public.verification_doc_type NOT NULL,
  file_url text NOT NULL,
  status public.verification_doc_status NOT NULL DEFAULT 'uploaded',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_verification_documents ENABLE ROW LEVEL SECURITY;

-- RLS: Vendors can view their own docs
CREATE POLICY "Vendors can view their own documents"
ON public.vendor_verification_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_verification_documents.vendor_id
      AND v.owner_user_id = auth.uid()
  )
);

-- RLS: Vendors can insert their own docs
CREATE POLICY "Vendors can upload their own documents"
ON public.vendor_verification_documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_verification_documents.vendor_id
      AND v.owner_user_id = auth.uid()
  )
);

-- RLS: Admins can view all docs
CREATE POLICY "Admins can view all verification documents"
ON public.vendor_verification_documents
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Admins can update all docs
CREATE POLICY "Admins can update verification documents"
ON public.vendor_verification_documents
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Admins can update any vendor (for verification)
-- Already exists as "Admins can update any vendor"

-- Trigger for updated_at
CREATE TRIGGER update_vendor_verification_documents_updated_at
BEFORE UPDATE ON public.vendor_verification_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
