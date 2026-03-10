CREATE OR REPLACE FUNCTION public.increment_vendor_view_count(vendor_id_input uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE vendors SET view_count = COALESCE(view_count, 0) + 1 WHERE id = vendor_id_input;
$$