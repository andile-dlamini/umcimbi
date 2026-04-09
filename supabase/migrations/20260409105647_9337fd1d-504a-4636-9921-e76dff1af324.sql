-- Add escrow release columns to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS dispute_raised_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispute_raised_by text,
  ADD COLUMN IF NOT EXISTS funds_released_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_confirmed_at timestamptz;

-- Create delivery-proofs storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-proofs', 'delivery-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: Anyone can read delivery proof files
CREATE POLICY "Public can read delivery proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'delivery-proofs');

-- RLS: Authenticated users can upload delivery proof files
CREATE POLICY "Authenticated users can upload delivery proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'delivery-proofs');