ALTER TABLE public.payment_proofs
  ADD COLUMN IF NOT EXISTS yoco_checkout_id text,
  ADD COLUMN IF NOT EXISTS amount_cents integer,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS yoco_processed_at timestamptz;