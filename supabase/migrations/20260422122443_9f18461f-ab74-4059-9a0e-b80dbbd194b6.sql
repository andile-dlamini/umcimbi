CREATE TABLE IF NOT EXISTS public.vendor_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'ZAR',
  internal_reference text NOT NULL UNIQUE,
  ozow_payout_id text,
  ozow_reference text,
  status text NOT NULL DEFAULT 'pending',
  failure_reason text,
  request_payload jsonb,
  response_payload jsonb,
  submitted_at timestamp with time zone,
  paid_at timestamp with time zone,
  failed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payout_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_payout_id uuid REFERENCES public.vendor_payouts(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  ozow_status text,
  raw_payload jsonb,
  redacted_payload jsonb,
  headers_redacted jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_payouts_booking_id ON public.vendor_payouts(booking_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_vendor_id ON public.vendor_payouts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_status ON public.vendor_payouts(status);
CREATE INDEX IF NOT EXISTS idx_vendor_payouts_ozow_refs ON public.vendor_payouts(ozow_payout_id, ozow_reference);
CREATE INDEX IF NOT EXISTS idx_payout_webhook_events_payout_id ON public.payout_webhook_events(vendor_payout_id);

ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_webhook_events ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_vendor_payouts_updated_at ON public.vendor_payouts;
CREATE TRIGGER update_vendor_payouts_updated_at
BEFORE UPDATE ON public.vendor_payouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Admins can view vendor payouts" ON public.vendor_payouts;
CREATE POLICY "Admins can view vendor payouts"
ON public.vendor_payouts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Vendors can view their own payouts" ON public.vendor_payouts;
CREATE POLICY "Vendors can view their own payouts"
ON public.vendor_payouts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.id = vendor_payouts.vendor_id
      AND v.owner_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Service role can manage vendor payouts" ON public.vendor_payouts;
CREATE POLICY "Service role can manage vendor payouts"
ON public.vendor_payouts
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can view payout webhook events" ON public.payout_webhook_events;
CREATE POLICY "Admins can view payout webhook events"
ON public.payout_webhook_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Service role can manage payout webhook events" ON public.payout_webhook_events;
CREATE POLICY "Service role can manage payout webhook events"
ON public.payout_webhook_events
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');