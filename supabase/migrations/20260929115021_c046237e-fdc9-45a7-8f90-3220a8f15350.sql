REVOKE ALL ON FUNCTION public.get_dormant_organisers(integer, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_dormant_organisers(integer, integer, integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dormant_organisers(integer, integer, integer) TO service_role;