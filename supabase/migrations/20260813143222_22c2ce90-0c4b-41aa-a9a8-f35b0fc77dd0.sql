create or replace function public.sync_email_queue_service_key(_key text)
returns text
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare v_id uuid;
begin
  select id into v_id from vault.secrets where name = 'email_queue_service_role_key' limit 1;
  if v_id is null then
    perform vault.create_secret(_key, 'email_queue_service_role_key', 'internal key for trigger->function calls');
    return 'created';
  else
    perform vault.update_secret(v_id, _key);
    return 'updated';
  end if;
end;
$$;

revoke all on function public.sync_email_queue_service_key(text) from public, anon, authenticated;
grant execute on function public.sync_email_queue_service_key(text) to service_role;