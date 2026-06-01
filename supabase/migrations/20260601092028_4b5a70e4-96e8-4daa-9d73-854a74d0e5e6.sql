DROP POLICY IF EXISTS "Active vendors viewable by authenticated users" ON public.vendors;

CREATE POLICY "Active vendors viewable by authenticated users"
ON public.vendors
FOR SELECT
TO authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Vendor owners can view their own profile" ON public.vendors;
CREATE POLICY "Vendor owners can view their own profile"
ON public.vendors
FOR SELECT
USING (auth.uid() = owner_user_id);

CREATE OR REPLACE FUNCTION public.get_own_vendor_bank_details(vendor_id UUID)
RETURNS TABLE (
  bank_name text,
  bank_account_holder_name text,
  bank_account_number text,
  bank_account_type text,
  bank_branch_code text,
  payout_method text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    bank_name,
    bank_account_holder_name,
    bank_account_number,
    bank_account_type,
    bank_branch_code,
    payout_method
  FROM public.vendors
  WHERE id = vendor_id
    AND owner_user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_own_vendor_bank_details(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_own_vendor_bank_details(UUID) TO authenticated;