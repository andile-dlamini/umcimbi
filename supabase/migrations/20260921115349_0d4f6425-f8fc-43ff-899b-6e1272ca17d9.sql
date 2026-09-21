ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS phone TEXT;

COMMENT ON COLUMN public.job_applications.phone IS
  'Applicant contact phone number, normalised by the submission function.';