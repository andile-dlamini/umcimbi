CREATE TABLE public.vendor_selfie_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_selfie_requests_token ON public.vendor_selfie_requests(token);
CREATE INDEX idx_vendor_selfie_requests_vendor_id ON public.vendor_selfie_requests(vendor_id);

-- Deliberately no grants to anon/authenticated and no RLS policies:
-- only the service role (edge functions) may read or write this table.
GRANT ALL ON public.vendor_selfie_requests TO service_role;
ALTER TABLE public.vendor_selfie_requests ENABLE ROW LEVEL SECURITY;

-- Existing tokens have been readable by every signed-in user, so they are
-- migrated as already consumed. Fresh links must be re-issued.
INSERT INTO public.vendor_selfie_requests (vendor_id, token, expires_at, consumed_at)
SELECT id, selfie_request_token, now() + interval '24 hours', now()
FROM public.vendors
WHERE selfie_request_token IS NOT NULL;

DROP INDEX IF EXISTS public.idx_vendors_selfie_token;
ALTER TABLE public.vendors DROP COLUMN selfie_request_token;