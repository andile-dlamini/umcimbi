-- Allow admins to insert vendors (for bulk upload)
CREATE POLICY "Admins can create vendors" 
ON public.vendors 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any vendor
CREATE POLICY "Admins can update any vendor" 
ON public.vendors 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete any vendor
CREATE POLICY "Admins can delete any vendor" 
ON public.vendors 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));