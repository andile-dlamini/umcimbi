-- job_applications table: captures Careers page submissions
-- Insert happens via the submit-job-application edge function (service role),
-- so no public INSERT policy is needed — only the service role writes here.

CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  story TEXT NOT NULL,
  socials TEXT,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'shortlisted', 'declined', 'hired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Matches the has_role() pattern already used across the codebase's admin RLS policies.
CREATE POLICY "Admins can read applications"
  ON public.job_applications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update applications"
  ON public.job_applications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Service role can insert applications"
  ON public.job_applications FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_role ON public.job_applications(role_slug);

-- Keep updated_at accurate for Phase 4's status changes
CREATE OR REPLACE FUNCTION public.update_job_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_applications_updated_at();