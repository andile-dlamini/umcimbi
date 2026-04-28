ALTER TABLE public.vendor_payouts
  ADD COLUMN IF NOT EXISTS encryption_key text,
  ADD COLUMN IF NOT EXISTS bank_group_id text;