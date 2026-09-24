# Vendor welcome message (SMS + email)

Send a welcome message the moment a new vendor finishes signing up. It welcomes them to UMCIMBI and invites them to the optional Vendor Community WhatsApp group.

**Only new vendors.** Nothing is sent to anyone already on the platform — no back-fill, no bulk run. The message is triggered by the act of joining, so vendors who joined before this goes live never receive it.

## What gets sent

**SMS** (vendors who signed up with a phone number):

> Sawubona {First Name}. Welcome to UMCIMBI! We are excited to have your business on board.
>
> I have also started an optional UMCIMBI Vendor Community WhatsApp group, where vendors learn from each other, ask questions, give feedback and celebrate successes. Joining is optional and other members can see your number. To join: https://chat.whatsapp.com/DNgVHc9z8bn4g2PlbMi8T1?mode=gi_t
>
> Kind regards, Andile

If no personal first name is saved, it falls back to the first word of their full name, then their business name.

**Email** (vendors who signed up with Google, or any vendor with an email on file):

- Subject: Welcome to UMCIMBI
- Branded UMCIMBI email: welcome, a line on what happens next (profile goes live to families planning ceremonies once reviewed), then a short section introducing the Vendor Community with a "Join the WhatsApp group" button.
- Notes that joining is optional and that members can see each other's numbers.
- Signed off by Andile.

## Safety rules

- Sent once per vendor, recorded in the existing SMS log under a new `vendor_welcome` campaign so a retry or double-submit can never send twice.
- Demo accounts never receive it.
- Vendors with no phone number simply get the email; vendors with no email get the SMS; whichever channel is available is used.
- Existing vendors are untouched — there is no admin button or batch run that could send this to the current list.

## Technical detail

- New email template `vendor-welcome.tsx` in `supabase/functions/_shared/transactional-email-templates/`, registered in `registry.ts`.
- New edge function `send-vendor-welcome`: takes `vendor_id`, verifies the caller owns that vendor, loads vendor + profile, checks `vendor_sms_log` for an existing `vendor_welcome` row (exit early if found), sends SMS via Connect Mobile and/or the email via `send-transactional-email` (idempotency key `vendor-welcome-{vendor_id}`), then writes the log row.
- Triggered non-blocking right after vendor creation succeeds, alongside the existing `registration` status SMS, in:
  - `src/pages/auth/AuthPage.tsx` (main signup wizard, after the vendors insert)
  - `src/pages/vendors/VendorOnboarding.tsx` (quick mode and full-form `handleFullOnCreated`)
- Because the trigger lives at the point of vendor creation, only vendors created after deployment can ever receive it.
