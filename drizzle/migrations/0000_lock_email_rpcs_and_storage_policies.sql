-- Email queue RPCs: service_role only (anon/authenticated had direct grants that REVOKE FROM PUBLIC did not remove)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb)             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, int, int)       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint)             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.enqueue_email(text, jsonb)             TO service_role;
GRANT  EXECUTE ON FUNCTION public.read_email_batch(text, int, int)       TO service_role;
GRANT  EXECUTE ON FUNCTION public.delete_email(text, bigint)             TO service_role;
GRANT  EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
ALTER FUNCTION public.enqueue_email(text, jsonb)             SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, int, int)       SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint)             SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

-- Quote PDFs: remove open upload policy (edge functions upload with service role, which bypasses RLS)
DROP POLICY IF EXISTS "Service role can upload quote PDFs" ON storage.objects;

-- Payment proofs: booking participants + admin only (path = {bookingId}/...)
DROP POLICY IF EXISTS "Booking participants can view payment proofs files" ON storage.objects;
DROP POLICY IF EXISTS "Clients can upload payment proofs" ON storage.objects;
CREATE POLICY "Booking participants can view payment proofs files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'payment-proofs' AND (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR EXISTS (SELECT 1 FROM public.bookings b
             WHERE b.id::text = (storage.foldername(name))[1]
               AND (b.client_id = auth.uid()
                    OR EXISTS (SELECT 1 FROM public.vendors v
                               WHERE v.id = b.vendor_id AND v.owner_user_id = auth.uid())))));
CREATE POLICY "Booking client can upload payment proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-proofs' AND EXISTS (
  SELECT 1 FROM public.bookings b
  WHERE b.id::text = (storage.foldername(name))[1] AND b.client_id = auth.uid()));