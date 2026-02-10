
-- Add structured address columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS address_line_1 text,
  ADD COLUMN IF NOT EXISTS address_line_2 text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state_province text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS postal_code text;

-- Add structured address columns to vendors table
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS address_line_1 text,
  ADD COLUMN IF NOT EXISTS address_line_2 text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state_province text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS postal_code text;
