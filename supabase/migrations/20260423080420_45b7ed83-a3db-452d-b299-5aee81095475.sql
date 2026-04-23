CREATE OR REPLACE FUNCTION public.get_admin_user_registration_stats()
RETURNS TABLE (
  total_vendors bigint,
  vendors_joined_this_month bigint,
  total_organisers bigint,
  organisers_joined_this_month bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (
      SELECT count(*)
      FROM public.vendors v
      WHERE v.owner_user_id IS NOT NULL
    ) AS total_vendors,
    (
      SELECT count(*)
      FROM public.vendors v
      WHERE v.owner_user_id IS NOT NULL
        AND v.created_at >= date_trunc('month', now())
    ) AS vendors_joined_this_month,
    (
      SELECT count(DISTINCT p.user_id)
      FROM public.profiles p
      WHERE EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = p.user_id
          AND ur.role = 'user'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = p.user_id
          AND ur.role IN ('vendor', 'admin')
      )
    ) AS total_organisers,
    (
      SELECT count(DISTINCT p.user_id)
      FROM public.profiles p
      WHERE p.created_at >= date_trunc('month', now())
        AND EXISTS (
          SELECT 1
          FROM public.user_roles ur
          WHERE ur.user_id = p.user_id
            AND ur.role = 'user'
        )
        AND NOT EXISTS (
          SELECT 1
          FROM public.user_roles ur
          WHERE ur.user_id = p.user_id
            AND ur.role IN ('vendor', 'admin')
        )
    ) AS organisers_joined_this_month
  WHERE public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_user_registration_stats() TO authenticated;