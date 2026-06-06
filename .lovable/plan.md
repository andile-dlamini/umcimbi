## Goal
Add three new demo accounts that mirror the existing `0820000901` demo setup, with easy on/off visibility control.

## Accounts to create
| Phone | Name | Role | Vendor name |
|---|---|---|---|
| 0710000002 | Maswazi Catering | vendor | Maswazi Catering |
| 0710000003 | Isizwe Catering | vendor | Isizwe Catering |
| 0710000004 | Luyanda | planner (user) | — |

All use password `Demo123!` (matching existing demo) and are marked `is_demo = true` on their profile.

## Implementation

### 1. New edge function: `setup-demo-accounts`
Modeled on `supabase/functions/setup-demo-account/index.ts`, but seeds all three accounts in one call (idempotent: delete + recreate by phone/email).

For each account:
- Create auth user (`<digits>@phone.isiko.app`, phone confirmed, password `Demo123!`)
- Complete profile (first_name, surname, `is_demo = true`, `phone_verified = true`, `is_profile_complete = true`)
- For vendors: insert `user_roles` vendor row + insert `vendors` row with `is_active = false`, `signup_source = 'demo_sandbox'`, category `catering`, location `Demo, ZA`, a clear "DEMO ONLY" about text
- For Luyanda: planner only — default `user` role from `handle_new_user` trigger is sufficient, no vendor row

Returns a JSON summary of all three accounts with credentials.

### 2. Visibility toggle
Vendor visibility is already controlled by `vendors.is_active` (RLS hides inactive vendors from the marketplace; the owner can still see their own). To activate/deactivate, flip that flag.

I'll add a tiny admin-only edge function `toggle-demo-vendor` that accepts `{ phone, active }` and updates `vendors.is_active` for the vendor owned by that phone's user. This means you can turn each demo vendor on/off on demand by calling the function (same pattern we used manually for `0820000901`).

The planner account has no marketplace visibility concept — it's just a login. No toggle needed.

### 3. Run the seeder once
After the function deploys, invoke `setup-demo-accounts` once with the service role to create all three. Subsequent calls are safe (idempotent).

## Files touched
- `supabase/functions/setup-demo-accounts/index.ts` (new — bulk seeder)
- `supabase/functions/toggle-demo-vendor/index.ts` (new — on/off switch)
- No schema migration needed (uses existing `vendors`, `profiles`, `user_roles`, `is_demo`, `is_active`)

## After build
I'll invoke `setup-demo-accounts` to create the three accounts, then confirm they're in the DB and both vendors start as `is_active = false` (hidden). You can then ask me to "activate Maswazi" / "deactivate Isizwe" etc. at any time.
