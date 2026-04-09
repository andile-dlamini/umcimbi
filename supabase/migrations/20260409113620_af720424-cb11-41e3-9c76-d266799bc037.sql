ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS payout_method text DEFAULT 'bank_eft',
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_account_holder_name text,
  ADD COLUMN IF NOT EXISTS bank_account_number text,
  ADD COLUMN IF NOT EXISTS bank_branch_code text,
  ADD COLUMN IF NOT EXISTS bank_account_type text;