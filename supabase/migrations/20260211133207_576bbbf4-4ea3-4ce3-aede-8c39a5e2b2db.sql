
-- FIX 2: Track origin of service requests (client vs vendor initiated)
ALTER TABLE public.service_requests 
ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'client_initiated';

-- FIX 3: Explicit letterhead opt-in for vendors
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS letterhead_enabled boolean NOT NULL DEFAULT false;

-- Auto-enable letterhead for vendors who already have branding
UPDATE public.vendors SET letterhead_enabled = true 
WHERE logo_url IS NOT NULL OR vendor_business_type = 'registered_business';

-- FIX 7: Payment timestamps for deterministic status tracking
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS deposit_due_at timestamptz,
ADD COLUMN IF NOT EXISTS deposit_paid_at timestamptz,
ADD COLUMN IF NOT EXISTS balance_due_at timestamptz,
ADD COLUMN IF NOT EXISTS balance_paid_at timestamptz;

-- Set deposit_due_at for existing pending bookings
UPDATE public.bookings 
SET deposit_due_at = created_at 
WHERE deposit_due_at IS NULL AND booking_status = 'pending_deposit';

-- Set deposit_paid_at for bookings where deposit is already paid
UPDATE public.bookings 
SET deposit_paid_at = updated_at 
WHERE deposit_paid_at IS NULL AND deposit_status = 'paid';

-- Set balance_due_at for confirmed bookings
UPDATE public.bookings 
SET balance_due_at = deposit_paid_at 
WHERE balance_due_at IS NULL AND balance_status = 'due';

-- Set balance_paid_at for fully paid bookings
UPDATE public.bookings 
SET balance_paid_at = updated_at 
WHERE balance_paid_at IS NULL AND balance_status = 'paid';
