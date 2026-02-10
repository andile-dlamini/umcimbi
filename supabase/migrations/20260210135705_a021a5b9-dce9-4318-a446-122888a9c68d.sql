
-- Add new columns to profiles for the registration flow
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS surname text,
  ADD COLUMN IF NOT EXISTS address text;

-- Create otp_requests table for secure OTP management
CREATE TABLE public.otp_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  otp_hash text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  send_count integer NOT NULL DEFAULT 1,
  last_sent_at timestamp with time zone NOT NULL DEFAULT now(),
  verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on otp_requests
ALTER TABLE public.otp_requests ENABLE ROW LEVEL SECURITY;

-- Only edge functions (service role) should access this table, no client access
-- No RLS policies = no client access (RLS enabled but no permissive policies)

-- Index for quick lookups
CREATE INDEX idx_otp_requests_phone ON public.otp_requests (phone_number, created_at DESC);

-- Clean up old OTP records automatically (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.otp_requests 
  WHERE expires_at < now() - interval '1 hour';
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_otps_on_insert
AFTER INSERT ON public.otp_requests
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_otps();
