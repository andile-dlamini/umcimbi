CREATE OR REPLACE FUNCTION public.get_incomplete_vendor_signups()
RETURNS TABLE(user_id uuid, full_name text, phone_number text, email text, signed_up_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.user_id, p.full_name, p.phone_number, p.email, p.created_at
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.role = 'vendor'
  WHERE NOT EXISTS (
      SELECT 1 FROM public.vendors v WHERE v.owner_user_id = p.user_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles a WHERE a.user_id = p.user_id AND a.role = 'admin'
    )
    AND COALESCE(p.is_demo, false) = false
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  ORDER BY p.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_incomplete_vendor_signups() FROM public;
GRANT EXECUTE ON FUNCTION public.get_incomplete_vendor_signups() TO authenticated;