
ALTER TABLE public.booking_reviews
  ADD COLUMN IF NOT EXISTS communication_rating integer,
  ADD COLUMN IF NOT EXISTS service_rating integer,
  ADD COLUMN IF NOT EXISTS payment_rating integer;
