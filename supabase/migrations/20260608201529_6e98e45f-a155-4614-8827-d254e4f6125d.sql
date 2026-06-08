ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_approval_notes text,
  ADD COLUMN IF NOT EXISTS selfie_request_token text,
  ADD COLUMN IF NOT EXISTS selfie_request_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS selfie_photo_url text;

CREATE INDEX IF NOT EXISTS idx_vendors_selfie_token ON public.vendors(selfie_request_token) WHERE selfie_request_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_approval_queue ON public.vendors(is_active, is_banned, is_demo, created_at);