
## Recording Demo Accounts

Add 3 always-on demo accounts (1 planner, 2 catering vendors) for platform demo recordings. Accounts bypass OTP and are auto-created when the migration runs.

### Part 1 — New edge function
Create `supabase/functions/setup-recording-accounts/index.ts` following the `setup-demo-account` pattern, but:
- Service-role Bearer auth check
- Iterates over 3 accounts (Luyanda Dlamini planner, Maswazi Ngcobo + Anele Mkhize vendors)
- Vendors get `is_active: true`, `is_demo: true`
- Idempotent (deletes existing users with same phone/email first)
- Password `RecordUmcimbi2026!`, OTP fallback `123456`

Add to `supabase/config.toml`:
```
[functions.setup-recording-accounts]
verify_jwt = false
```

### Part 2 — Migration
- `ALTER TABLE vendors ADD COLUMN is_demo boolean NOT NULL DEFAULT false`
- `ALTER TABLE profiles ADD COLUMN is_demo boolean NOT NULL DEFAULT false`
- `CREATE INDEX idx_vendors_is_demo`
- Trigger the new function via `extensions.http_post(...)` using `current_setting('app.supabase_url')` and `current_setting('app.supabase_service_role_key')`, same pattern as admin-daily-brief

### Part 3 — Whitelist phones
Append `+27710000002/3/4` to the `DEMO_PHONES` array in:
- `supabase/functions/send-otp/index.ts`
- `supabase/functions/verify-otp/index.ts`
- `supabase/functions/demo-login/index.ts`

### Part 4 — Hide demo vendors from real users
In `src/hooks/useVendors.ts`, add `.eq('is_demo', false)` immediately after each of the 3 `.eq('is_active', true)` lines.

### Part 5 — Deploy
Deploy `setup-recording-accounts`, `send-otp`, `verify-otp`, `demo-login`.

### Notes
- No changes to existing 0820000901-904 demo accounts or `setup-demo-account`
- No page-component changes
- Memory will be updated to record the new is_demo filter convention
