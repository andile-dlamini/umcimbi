-- Create order number sequence
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1 INCREMENT BY 1;

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE sql
SET search_path TO 'public'
AS $$
  SELECT 'UMC-O-' || EXTRACT(YEAR FROM now())::text || '-' || LPAD(nextval('public.order_number_seq')::text, 6, '0');
$$;

-- Add order columns to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS order_number text UNIQUE,
  ADD COLUMN IF NOT EXISTS order_pdf_key text,
  ADD COLUMN IF NOT EXISTS order_pdf_generated_at timestamptz;