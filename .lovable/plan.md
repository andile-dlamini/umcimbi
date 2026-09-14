# One-off SMS campaign: vendors with unfinished profiles

Reach vendors who signed up but never created a business profile, with a single SMS each, tracked so nobody is messaged twice. No screens change.

## What gets built

**1. A record of who was messaged**

A new table `vendor_sms_log` storing user, campaign name, time sent, status (`sent` / `failed`) and the provider's reply. One row per user per campaign, so re-running the campaign skips anyone already contacted. Only admins can read or write it.

**2. A new admin-only function `send-vendor-recovery-sms`**

- Authorisation copied from the existing vendor status SMS function: bearer token, admin check against `user_roles`, otherwise rejected.
- Body `{ dry_run: boolean }`, defaulting to `true`. Nothing is sent or written unless `dry_run` is explicitly `false`.
- Audience: profiles with the vendor role, not demo, phone verified, phone number present, no vendor business record, and no existing `vendor_recovery` log row.
- Message (first name falls back to "there"):

```text
Hi {first_name}. This is Andile Dlamini from UMCIMBI. Thanks for signing up as a vendor, but we noticed you haven't finished your business profile so that your business can be online. Please complete your profile by following this link: umcimbi.co.za/complete-profile?ref=vendor-recovery
```

- Dry run returns `{ dry_run: true, count, recipients: [{ user_id, first_name, phone_number, message }] }`.
- Live run sends via the same Connect Mobile GET endpoint, phone normalisation and Authorization header as the existing function; logs each attempt; continues past individual failures; returns `{ dry_run: false, attempted, sent, failed, results }`.

**3. Config**

Register the function in `supabase/config.toml` with `verify_jwt = false`, matching the other manually invoked functions, since auth is enforced in code.

## Technical notes

- Migration order: create table, grants (`select` to authenticated, `all` to service_role), enable RLS, then the two admin policies, exactly as specified.
- Audience query uses the service-role client; vendor role filter via `user_roles`, exclusions via lookups on `vendors.owner_user_id` and `vendor_sms_log.user_id` (campaign `vendor_recovery`).
- Insert into `vendor_sms_log` after every attempt, capturing the provider response text.

## Out of scope

No changes to `send-vendor-status-sms`, any other edge function, or any frontend file.
