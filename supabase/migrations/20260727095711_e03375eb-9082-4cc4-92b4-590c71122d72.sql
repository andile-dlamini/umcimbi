CREATE TABLE IF NOT EXISTS public.vendor_registration_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('24h', '72h')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, reminder_type)
);

GRANT ALL ON public.vendor_registration_reminders TO service_role;

ALTER TABLE public.vendor_registration_reminders ENABLE ROW LEVEL SECURITY;