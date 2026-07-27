## Goal

1. Vendors land in-app after signup instead of being forced to `/vendors/onboarding`.
2. Vendor dashboard empty state reworded for that new common state.
3. New hourly job that SMSes vendor-role users who still have no business profile at 24h and 72h.

## 1. `src/pages/auth/AuthPage.tsx`

Replace the vendor branch after password creation (~line 558) so both roles do:

```
setStep('success');
toast.success('Account created successfully!');
```

Business/Showcase steps and `/vendors/onboarding` stay untouched — just no longer forced.

## 2. `src/pages/vendor-dashboard/VendorDashboard.tsx`

In the `!vendorProfile` block:
- Heading: "Let's finish setting up your business"
- Body: "Add your business details so families can find and book you."
- Button: "Complete your profile" (same `navigate('/vendors/onboarding')`)

## 3. Reminder table (migration)

`public.vendor_registration_reminders` — `user_id` (FK `auth.users`, cascade), `reminder_type` ('24h'|'72h' check), `sent_at`, unique `(user_id, reminder_type)`. RLS enabled, no policies (service-role only), plus `GRANT ALL ON public.vendor_registration_reminders TO service_role` so the edge function can reach it.

## 4. Edge function `supabase/functions/vendor-registration-reminder/index.ts`

Implemented exactly as your revised draft: shared `normalizeSaPhone` / `sendConnectMobileSms`, `profiles` keyed on `user_id`, `sms_enabled` opt-out check, and insert-first into `vendor_registration_reminders` as the duplicate lock (unique violation → skip).

One correction found while checking the schema: `sms_notification_log.tier` has a CHECK constraint allowing only `tier1 | tier2 | suppressed`, so passing `'24h'`/`'72h'` would fail the insert. The log row will use `tier: 'tier1'` (with `'suppressed'` when a send is skipped/fails), and the 24h vs 72h distinction stays in `event_type` (`vendor_registration_reminder_24h` / `_72h`) as your draft already does.

## 5. `supabase/config.toml`

```
[functions.vendor-registration-reminder]
verify_jwt = false
```

## 6. Hourly cron

Schedule `vendor-registration-reminder` at `0 * * * *`, unscheduling any prior job of the same name first, calling the function with the vault-stored service-role key. Because this SQL embeds the project URL and vault key, it runs as a data operation (insert tool), not a schema migration — same approach as the other cron jobs here.

## Out of scope
`VendorProfileForm.tsx`, `VendorOnboarding.tsx`, `send-vendor-status-sms`, approval queue, vendor RLS, all other edge functions.

## Verification
- Typecheck.
- New signup lands in-app with the new empty-state copy; `/vendors/onboarding` still works via the button.
- No live cron trigger against real vendor numbers during testing.
