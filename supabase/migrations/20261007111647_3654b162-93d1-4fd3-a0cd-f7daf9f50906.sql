CREATE OR REPLACE FUNCTION public.get_admin_user_ids()
 RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT user_id FROM public.user_roles WHERE role = 'admin' AND public.has_role(auth.uid(), 'admin'::public.app_role) $$;
REVOKE EXECUTE ON FUNCTION public.get_admin_user_ids() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_admin_user_ids() TO authenticated;