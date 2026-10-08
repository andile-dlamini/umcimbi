-- 1. Callable functions that check permissions internally: remove visitor access, keep signed-in
REVOKE EXECUTE ON FUNCTION public.get_admin_activation_stats()        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_user_registration_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_ceremony_pipeline()             FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_incomplete_vendor_signups()     FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_stalled_conversations(integer)  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_own_vendor_bank_details(uuid)   FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reset_own_vendor_dormancy()         FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_vendor_view_count(uuid)   FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_activation_stats()        TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_user_registration_stats() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_ceremony_pipeline()             TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_incomplete_vendor_signups()     TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_stalled_conversations(integer)  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_own_vendor_bank_details(uuid)   TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reset_own_vendor_dormancy()         TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_vendor_view_count(uuid)   TO authenticated, service_role;

-- 2. Backend-only functions (called by edge functions with service role, or by cron as owner)
REVOKE EXECUTE ON FUNCTION public.get_vendor_last_sign_in(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch()        FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_vendor_last_sign_in(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch()        TO service_role;

-- 3. Trigger functions: never called directly (EXECUTE is not checked when a trigger fires)
REVOKE EXECUTE ON FUNCTION public.add_vendor_role()            FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_otps()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake()           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.evaluate_super_vendor()      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()            FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.limit_vendor_images()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_first_message()       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_service_request() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_vendor_rating()       FROM PUBLIC, anon, authenticated;