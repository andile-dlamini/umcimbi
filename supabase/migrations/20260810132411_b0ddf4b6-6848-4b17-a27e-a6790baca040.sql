CREATE POLICY "Admins can upload verification documents"
ON public.vendor_verification_documents
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DO $$
BEGIN
  PERFORM cron.unschedule('admin-daily-brief');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;