# Bulk Vendor Import (Admin)

Full field parity with `VendorOnboarding.tsx`, plus a post-creation media/documents attachment step. Reuses existing patterns; no new deps, no changes to self-signup or approval queue.

## 1. SMS template
Edit `supabase/functions/_shared/smsTemplates.ts`:
- Add `"vendor_bulk_registered"` to the `SmsEvent` union.
- Add the `T` entry:
  ```
  vendor_bulk_registered: ({ name }) =>
    `Hi ${name}, you've been registered on UMCIMBI! Open the app, tap "Forgot password", and enter this number to set your own password and get started: umcimbi.co.za`
  ```

## 2. Edge function `supabase/functions/bulk-vendor-import/index.ts`

Shared setup:
- CORS via `npm:@supabase/supabase-js@2/cors`.
- Two clients: anon-key client (for `getClaims`) + service-role client (all writes).
- Admin gate on both actions (mirrors `check-sms-balance` / `get-final-offer-url`): read `Authorization: Bearer`, `anon.auth.getClaims(token)`, then `service.rpc('has_role', { _user_id, _role: 'admin' })` — 403 if false.
- Dispatch on `body.action`.

### `action: "create_vendors"`
Per row, in order, wrapped in try/catch so one failure never stops the batch:
1. Normalize phone the way `reset-password/index.ts` does (strip spaces; leading `0` → `+27`; ensure `+` prefix).
2. `profiles.select('user_id').eq('phone_number', normalized).maybeSingle()`. If found → push `{ row, status: "skipped", reason: "phone_already_registered" }` and continue.
3. Create auth user: `admin.createUser({ email: `${normalized.replace('+','')}@phone.isiko.app`, password: crypto.randomUUID(), phone: normalized, phone_confirm: true, email_confirm: true, user_metadata: { full_name: name } })`. Password never logged/returned.
4. Insert `profiles { user_id, phone_number: normalized, full_name: name }`.
5. Insert `vendors` with all provided fields; `languages` defaults to `['English']`; `is_active: true`; `signup_source: 'admin_bulk_import'`; and the exact `is_registered_business` conditional block from `VendorOnboarding.tsx` (vendor_business_type / business_verification_status / registered_business_name / registration_number / vat_number).
6. Fire-and-log `sendConnectMobileSms(normalizeSaPhone(normalized), renderSms('vendor_bulk_registered', { name }), <msgId>)` — same imports as `notify-vendor-event`.
7. Push `{ row, status: "created", vendor_id, user_id, is_registered_business }` (or `"failed"` with `reason`).

Returns `{ results: [...] }`.

### `action: "attach_media"`
Per entry, non-blocking:
- If `logo_url` or `image_urls`: fetch current `vendors.image_urls`, append (dedup), update `{ logo_url?, image_urls? }`.
- If `verification_documents`: bulk-insert into `vendor_verification_documents` with `{ vendor_id, doc_type, file_url, status: 'uploaded' }` — same shape as `VendorOnboarding.tsx`.
- Push `{ vendor_id, status: "updated" | "failed", reason? }`.

## 3. Admin page `src/pages/admin/VendorBulkImport.tsx`
Route: `/admin/vendor-import` inside the existing `<AdminGuard><AdminLayout /></AdminGuard>` block in `App.tsx`. Add nav entry to `src/components/admin/AdminSidebar.tsx` (`Bulk Import`, `Upload` icon).

State machine: `upload → preview → importing → results → attaching → done`.

**Step 1 — CSV upload & preview**
- `<Input type="file" accept=".csv">`. Hint card lists the exact expected columns.
- Inline CSV parser: line split respecting `"…"` quotes and `""` escapes; first row is header; map into typed row objects.
- Preview `<Table>`:
  - `category` = shadcn `<Select>` from `VENDOR_CATEGORIES` (`src/lib/vendorCategories.ts`).
  - `is_registered_business` = `<Checkbox>` per row; when off, gray out (`opacity-50 pointer-events-none`) the three registered-business fields visually but keep the CSV values in state.
  - Missing `name` / `category` / `phone_number` → red badge on the row; row is excluded from submission but batch continues.
- "Confirm Import" → `supabase.functions.invoke('bulk-vendor-import', { body: { action: 'create_vendors', rows } })`.

**Step 2 — attach media & documents**
- Results `<Table>` with `<Badge>` (green Created / amber Skipped / red Failed) styled like `VendorVerificationQueue.tsx`; show reason.
- For each `Created` row:
  - Logo file picker (single image).
  - Gallery file picker (multi, capped at 6, live count shown).
  - If `is_registered_business` was true: verification-docs picker (multi) with per-file `<Select>` for `doc_type` (`cipc_registration | proof_of_address | bank_confirmation | vat_certificate | other`).
- "Upload & Finish": for each vendor with selections, upload to `vendor-images` bucket using the exact path conventions from `VendorOnboarding.tsx`:
  - `${vendor_id}/logo.${ext}`
  - `${vendor_id}/showcase-${i}.${ext}`
  - `${vendor_id}/docs/doc-${i}.${ext}`
  Collect `getPublicUrl()` URLs, then a single `attach_media` invoke.
- Show per-vendor final status with a "Retry" button that re-runs upload + attach for just that vendor.

Uses existing shadcn primitives (`Table`, `Card`, `Badge`, `Button`, `Input`, `Select`, `Checkbox`) — visual style matches `VendorVerificationQueue.tsx` / `SuperVendorManagement.tsx`. Uses `PageHeader` per project convention.

## Files touched
- Edit: `supabase/functions/_shared/smsTemplates.ts`
- New: `supabase/functions/bulk-vendor-import/index.ts`
- New: `src/pages/admin/VendorBulkImport.tsx`
- Edit: `src/App.tsx` (route)
- Edit: `src/components/admin/AdminSidebar.tsx` (nav entry)

## Out of scope
No changes to self-signup, `vendor-selfie-submission`, approval queue, `reset-password`, `seed-demo-users`, or vendor RLS policies. No new npm dependencies.
