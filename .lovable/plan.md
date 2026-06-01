# Export Planner Registrations (Last 10 Days)

Pull all users who registered as **planners** (role = `user`, no `vendor`/`admin` role) in the last 10 days and export to CSV.

## Query
```sql
SELECT p.first_name, p.surname, p.phone_number, p.email, p.created_at
FROM public.profiles p
WHERE p.created_at >= now() - interval '10 days'
  AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id AND ur.role = 'user')
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id AND ur.role IN ('vendor','admin'))
ORDER BY p.created_at DESC;
```

## Deliverable
- CSV file at `/mnt/documents/planners_last_10_days.csv` with columns: first_name, surname, phone_number, email, created_at
- Preview of row count + presentation-artifact tag for download

## Notes
- Most planners signed up via phone OTP, so `email` is mostly NULL — that's expected, not a bug.
- No code/schema changes; read-only data export.