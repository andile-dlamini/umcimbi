CREATE OR REPLACE FUNCTION public.vault_create_email_queue_key(new_secret text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM vault.create_secret(new_secret, 'email_queue_service_role_key', 'Service role key for internal edge function calls');
END;
$$;

CREATE OR REPLACE FUNCTION public.vault_update_email_queue_key(new_secret text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id FROM vault.secrets WHERE name = 'email_queue_service_role_key';
  IF v_id IS NULL THEN
    PERFORM vault.create_secret(new_secret, 'email_queue_service_role_key', 'Service role key for internal edge function calls');
  ELSE
    PERFORM vault.update_secret(v_id, new_secret);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.vault_create_email_queue_key(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vault_update_email_queue_key(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vault_create_email_queue_key(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.vault_update_email_queue_key(text) TO service_role;