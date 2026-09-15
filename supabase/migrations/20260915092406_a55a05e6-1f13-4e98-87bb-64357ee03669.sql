create or replace function public.get_vendor_public_stats()
returns table (
  vendor_id uuid,
  completed_bookings bigint,
  responds_quickly boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with completed as (
    select b.vendor_id, count(*) as n
    from bookings b
    where b.booking_status = 'completed'
    group by b.vendor_id
  ),
  responses as (
    select
      sr.vendor_id,
      count(*) as responded_count,
      percentile_cont(0.5) within group (
        order by extract(epoch from (sr.responded_at - sr.created_at)) / 3600
      ) as median_hours
    from service_requests sr
    where sr.responded_at is not null
    group by sr.vendor_id
  )
  select
    v.id as vendor_id,
    coalesce(c.n, 0) as completed_bookings,
    coalesce(r.responded_count >= 2 and r.median_hours <= 24, false) as responds_quickly
  from vendors v
  left join completed c on c.vendor_id = v.id
  left join responses r on r.vendor_id = v.id;
$$;

revoke all on function public.get_vendor_public_stats() from public;
grant execute on function public.get_vendor_public_stats() to anon, authenticated;