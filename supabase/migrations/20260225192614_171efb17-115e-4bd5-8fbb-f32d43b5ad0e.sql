
-- Create payment_proofs table for EFT proof upload
CREATE TABLE public.payment_proofs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  payer_user_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('deposit', 'balance')),
  storage_key TEXT NOT NULL,
  reference_text TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'verified', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

-- Booking participants can view payment proofs
CREATE POLICY "Booking participants can view payment proofs"
ON public.payment_proofs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = payment_proofs.booking_id
    AND (
      b.client_id = auth.uid()
      OR EXISTS (SELECT 1 FROM vendors v WHERE v.id = b.vendor_id AND v.owner_user_id = auth.uid())
    )
  )
  OR has_role(auth.uid(), 'admin')
);

-- Payer can create payment proofs
CREATE POLICY "Payer can create payment proofs"
ON public.payment_proofs FOR INSERT
WITH CHECK (
  payer_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = payment_proofs.booking_id AND b.client_id = auth.uid()
  )
);

-- Vendor or admin can update (verify/reject) payment proofs
CREATE POLICY "Vendor or admin can update payment proofs"
ON public.payment_proofs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN vendors v ON v.id = b.vendor_id
    WHERE b.id = payment_proofs.booking_id AND v.owner_user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

-- Create payment-proofs storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false);

-- Storage policies for payment-proofs bucket
CREATE POLICY "Clients can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Booking participants can view payment proofs files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-proofs'
  AND auth.uid() IS NOT NULL
);

-- Add pending_verification to payment_status enum
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'pending_verification';

-- Enable realtime for payment_proofs
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_proofs;
