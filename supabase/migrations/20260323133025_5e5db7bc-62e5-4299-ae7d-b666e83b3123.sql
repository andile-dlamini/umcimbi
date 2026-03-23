
CREATE TABLE IF NOT EXISTS public.waitlist_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  phone_number text,
  role text CHECK (role IN ('organiser', 'vendor')),
  source text DEFAULT 'waitlist_page',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public waitlist insert"
  ON public.waitlist_signups FOR INSERT
  TO anon WITH CHECK (true);

CREATE POLICY "Authenticated waitlist insert"
  ON public.waitlist_signups FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Admins read waitlist"
  ON public.waitlist_signups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );
