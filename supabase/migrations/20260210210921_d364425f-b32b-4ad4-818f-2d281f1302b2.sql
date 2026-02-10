-- Allow vendor owners to SELECT their own profile (even if not active)
CREATE POLICY "Vendor owners can view their own profile"
ON public.vendors
FOR SELECT
USING (auth.uid() = owner_user_id);