# Curated vendor marketplace view (part one)

Purely additive: add a curated view that hides the sensitive vendor columns, then move general browsing reads onto it. No access rules change, so nothing that works today can break.

## 1. Migration — `public.vendors_marketplace`

New migration file in `supabase/migrations`:

- Creates `public.vendors_marketplace` listing every current column of `public.vendors` by name **except** `bank_account_number`, `bank_account_holder_name`, `bank_branch_code`, `bank_account_type`, `registration_number`, `vat_number`, `admin_approval_notes`. No `SELECT *`, so a future column is never exposed by accident.
- `WITH (security_invoker = on)` — the view runs under the caller's own permissions, so it returns exactly the rows their access rules already allow, minus the seven columns. A vendor owner still sees their own inactive row through it.
- No `WHERE` clause; filtering stays with the callers.
- `GRANT SELECT ... TO authenticated` only. No grant to anonymous visitors.
- No access-rule (RLS) changes, and `vendors_directory_public` untouched.

## 2. Browsing callers moved onto the view

Table name swapped from `vendors` to `vendors_marketplace`, `select('*')` and all filters, ordering and error handling kept exactly as they are:

- `src/hooks/useVendors.ts` — the list query (line 19) and the `useVendor` single lookup (line 73)
- `src/hooks/useVendorsWithDistance.ts` — line 45
- `src/hooks/useChat.ts` — both conversation vendor lookups (lines 34 and 174)

The view-count RPC in `useVendor` stays as is; it is a function call, not a table read.

## 3. Left on `public.vendors` unchanged

Owner-scoped and admin-scoped code that legitimately needs the full row: `AuthContext.tsx`, `useVendors.ts` line 115 (`useMyVendorProfile`), `Settings.tsx`, `AuthPage.tsx`, `VendorOnboarding.tsx`, `VendorProfileForm.tsx`, `useEvents.ts`, `useServiceRequests.ts`, and everything under `src/pages/admin/`. All writes continue to go to the table, never the view.

## 4. Types, and the field-usage audit (already done)

Regenerate `src/integrations/supabase/types.ts` after the migration so the view is typed. You are right that a clean compile proves nothing here: the hooks cast to the `Vendor` type, which still declares all seven fields, so TypeScript would accept the cast silently. I therefore grepped instead. Findings across the whole of `src/`:

- **`registration_number` / `vat_number`** — read only in `BrandingSection.tsx` (display) and written in `VendorProfileForm.tsx`, `AuthPage.tsx`, `VendorOnboarding.tsx`, plus the admin queue.
- **The four bank fields** — read only in `PayoutDetailsSection.tsx` and written in the same owner/admin forms.
- **`admin_approval_notes`** — referenced only in `src/pages/admin/VendorVerificationQueue.tsx`.

`BrandingSection` and `PayoutDetailsSection` are both rendered by `src/pages/profile/VendorProfile.tsx`, which gets its data from `useMyVendorProfile` — the owner-scoped query that stays on `public.vendors`. So none of the seven fields is reached from the four migrated callers or anything downstream of them: not the vendor list, not the vendor detail page, not the distance list, not chat. The migration is safe on the evidence, not just on the compiler.


## Verification

- Migration file present; view created with `security_invoker = on` and explicit columns.
- Query the view's column list and confirm all seven sensitive columns are absent.
- Load vendor browsing, a vendor detail page, chat and the vendor dashboard.
- Confirm a vendor owner still sees and can edit their own profile.

## Out of scope

No access-rule changes (that is part two), no changes to `vendors_directory_public`, the selfie verification work, quote/booking/payment/payout/Ozow code, quote documents, SMS, or the public landing pages and their vendor browser components.
