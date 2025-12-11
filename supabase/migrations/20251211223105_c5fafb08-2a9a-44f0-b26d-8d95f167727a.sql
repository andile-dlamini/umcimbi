-- Update service_request_status enum to include new statuses
ALTER TYPE service_request_status ADD VALUE IF NOT EXISTS 'expired';
ALTER TYPE service_request_status ADD VALUE IF NOT EXISTS 'vendor_declined';

-- Add expires_at to service_requests
ALTER TABLE public.service_requests 
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT (now() + interval '48 hours');

-- Create quote_status enum
DO $$ BEGIN
  CREATE TYPE quote_status AS ENUM ('pending_client', 'client_accepted', 'client_declined', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create booking_status enum
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('pending_deposit', 'confirmed', 'cancelled', 'completed', 'disputed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create payment_status enum
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('not_due', 'due', 'paid');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create quotes table
CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  price numeric NOT NULL,
  notes text,
  proposed_date_time_window text,
  status quote_status NOT NULL DEFAULT 'pending_client',
  expires_at timestamp with time zone DEFAULT (now() + interval '48 hours'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  service_category text,
  agreed_price numeric NOT NULL,
  event_date_time timestamp with time zone,
  deposit_amount numeric DEFAULT 0,
  balance_amount numeric DEFAULT 0,
  booking_status booking_status NOT NULL DEFAULT 'pending_deposit',
  deposit_status payment_status NOT NULL DEFAULT 'not_due',
  balance_status payment_status NOT NULL DEFAULT 'not_due',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create delivery_proofs table
CREATE TABLE IF NOT EXISTS public.delivery_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL,
  photos text[] DEFAULT ARRAY[]::text[],
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create booking_reviews table (for both client and vendor reviews)
CREATE TABLE IF NOT EXISTS public.booking_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reviewer_type text NOT NULL CHECK (reviewer_type IN ('client', 'vendor')),
  reviewer_id uuid NOT NULL,
  reviewed_party_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(booking_id, reviewer_type)
);

-- Enable RLS on all new tables
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_reviews ENABLE ROW LEVEL SECURITY;

-- Quotes policies
CREATE POLICY "Clients can view quotes for their requests"
ON public.quotes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.service_requests sr
    WHERE sr.id = quotes.request_id
    AND sr.requester_user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can view their own quotes"
ON public.quotes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = quotes.vendor_id
    AND v.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can create quotes for requests to them"
ON public.quotes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.service_requests sr
    JOIN public.vendors v ON v.id = sr.vendor_id
    WHERE sr.id = request_id
    AND v.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can update their own quotes"
ON public.quotes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = quotes.vendor_id
    AND v.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Clients can update quote status"
ON public.quotes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.service_requests sr
    WHERE sr.id = quotes.request_id
    AND sr.requester_user_id = auth.uid()
  )
);

-- Bookings policies
CREATE POLICY "Clients can view their bookings"
ON public.bookings FOR SELECT
USING (client_id = auth.uid());

CREATE POLICY "Vendors can view bookings for their services"
ON public.bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = bookings.vendor_id
    AND v.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Clients can create bookings"
ON public.bookings FOR INSERT
WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update their bookings"
ON public.bookings FOR UPDATE
USING (client_id = auth.uid());

CREATE POLICY "Vendors can update bookings for their services"
ON public.bookings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = bookings.vendor_id
    AND v.owner_user_id = auth.uid()
  )
);

-- Delivery proofs policies
CREATE POLICY "Booking participants can view delivery proofs"
ON public.delivery_proofs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = delivery_proofs.booking_id
    AND (
      b.client_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.vendors v
        WHERE v.id = b.vendor_id
        AND v.owner_user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Booking participants can upload delivery proofs"
ON public.delivery_proofs FOR INSERT
WITH CHECK (
  uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id
    AND (
      b.client_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.vendors v
        WHERE v.id = b.vendor_id
        AND v.owner_user_id = auth.uid()
      )
    )
  )
);

-- Booking reviews policies
CREATE POLICY "Anyone can view booking reviews"
ON public.booking_reviews FOR SELECT
USING (true);

CREATE POLICY "Booking participants can create reviews"
ON public.booking_reviews FOR INSERT
WITH CHECK (
  reviewer_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id
    AND b.booking_status = 'completed'
    AND (
      b.client_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.vendors v
        WHERE v.id = b.vendor_id
        AND v.owner_user_id = auth.uid()
      )
    )
  )
);

-- Update updated_at triggers
CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON public.quotes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();