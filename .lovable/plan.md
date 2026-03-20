

## Create Demo Test User (Bypass OTP)

Create a demo planner user directly via the Supabase Admin API, bypassing SMS OTP entirely.

### User Details
- **Name**: Demo User
- **Phone**: +27710000003
- **Email**: 27710000003@phone.isiko.app
- **Password**: demo123 (simple for testing)
- **Role**: Planner (default `user` role)

### Approach

Run a one-off script using `psql` + Supabase Admin API (via the existing `verify-otp` edge function pattern) to:

1. **Call Supabase Auth admin.createUser** — create the auth account with phone `+27710000003`, email auto-generated, password `demo123`, email/phone confirmed
2. **Profile auto-created** by the existing `handle_new_user` trigger (sets `user_id`, `email`, `phone_number`)
3. **Update profile** with `first_name: 'Demo'`, `surname: 'User'`, `full_name: 'Demo User'`, `phone_verified: true`
4. **Default `user` role** is auto-assigned by the same trigger

No code changes needed — this is a one-time data operation via the edge function infrastructure. I will invoke the `verify-otp` function with the demo data (it creates users via admin API), or create a small temporary edge function to seed this user.

### Login Credentials
- **Phone**: 0710000003
- **Password**: demo123

