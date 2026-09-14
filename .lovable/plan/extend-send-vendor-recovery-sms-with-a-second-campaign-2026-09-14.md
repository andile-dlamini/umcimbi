# Extend send-vendor-recovery-sms with a second campaign

## What we're building
Add a second SMS campaign (`service_areas`) to the existing edge function `supabase/functions/send-vendor-recovery-sms/index.ts`, without creating a new function or changing the migration, config.toml, other functions, or frontend.

## Files to change

### `supabase/functions/send-vendor-recovery-sms/index.ts`

1. **Request body schema**
   - Add `campaign: z.enum(['vendor_recovery', 'service_areas']).optional().default('vendor_recovery')` to the Zod body schema.
   - Reject any other campaign value with a 400 response.

2. **Keep `vendor_recovery` unchanged**
   - Preserve the existing audience query, message, and behaviour exactly as they are when `campaign === 'vendor_recovery'`.

3. **New `service_areas` campaign**
   - **Audience**: query `vendors` where `is_demo = false`, `is_banned = false`, `is_active = true`, no matching rows in `vendor_service_regions`, and the owner has no `vendor_sms_log` row for campaign `'service_areas'`.
   - **Phone number**: use `vendors.phone_number` when present; otherwise look up `profiles.phone_number` via `vendors.owner_user_id`.
   - **Skip list**: any vendor with neither phone number, or with a null `owner_user_id`, is added to a `skipped` array containing `vendor_id` and `name`. These vendors are not sent an SMS.
   - **First name**: read `profiles.first_name` via `owner_user_id`, falling back to `'there'`.
   - **Message template**:
     ```
     Hi {first_name}. This is Andile Dlamini from UMCIMBI. In response to the feedback from the families planning their ceremonies, we have added service areas to your profile, so families searching in your area can find your business. Please add the areas you serve here: umcimbi.co.za/update-service-areas?ref=service-areas
     ```
   - **Logging**: insert one `vendor_sms_log` row per owner user id, campaign `'service_areas'`, status `'sent'` or `'failed'`, with provider response.

4. **Response shape**
   - `dry_run: true` → return `{ dry_run: true, count, recipients }` as before.
   - `dry_run: false` → return `{ dry_run: false, attempted, sent, failed, results, skipped }`, adding the new `skipped` array.
   - Keep admin auth check, Connect Mobile GET send logic, phone normalisation, per-recipient error handling, and the existing `vendor_recovery` response shape unchanged.

## Not in scope
- No new edge function.
- No migration changes.
- No config.toml changes.
- No changes to `send-vendor-status-sms` or any frontend file.

## Verification
- Typecheck is not applicable for edge functions; deploy via `supabase--deploy_edge_functions` after approval.
- Test dry run for both campaigns with `supabase.functions.invoke('send-vendor-recovery-sms', { body: { dry_run: true, campaign: 'service_areas' } })`.
