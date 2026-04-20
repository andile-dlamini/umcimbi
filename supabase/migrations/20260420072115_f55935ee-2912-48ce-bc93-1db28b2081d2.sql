
CREATE TABLE public.sms_balance_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  balance INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('green', 'yellow', 'red', 'error')),
  raw_response JSONB,
  alert_sent BOOLEAN NOT NULL DEFAULT FALSE,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sms_balance_checks_checked_at ON public.sms_balance_checks (checked_at DESC);

ALTER TABLE public.sms_balance_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sms balance checks"
ON public.sms_balance_checks
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
