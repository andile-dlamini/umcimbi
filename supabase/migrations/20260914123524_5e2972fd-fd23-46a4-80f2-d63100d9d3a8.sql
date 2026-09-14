create table public.vendor_sms_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign text not null,
  sent_at timestamptz not null default now(),
  status text not null,
  provider_response text,
  unique (user_id, campaign)
);

grant select on public.vendor_sms_log to authenticated;
grant all on public.vendor_sms_log to service_role;

alter table public.vendor_sms_log enable row level security;

create policy "Admins can view sms log"
  on public.vendor_sms_log for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage sms log"
  on public.vendor_sms_log for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));