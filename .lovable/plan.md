# Retire CSV bulk import, add one-by-one admin vendor registration

Replace the CSV bulk-import tool with a proper admin flow that reuses the real vendor onboarding form. Admins create a shadow auth account for the vendor, fill in the same profile form vendors would, then release to vendor (SMS) and to public independently — with persistent access to manage previously-created admin vendors.

## 1. Retire the CSV tool

- `src/App.tsx`: remove the `/admin/vendor-import` route and its `VendorBulkImport` import.
- `src/components/admin/AdminSidebar.tsx`: remove the "Bulk Import" entry.
- Delete `src/pages/admin/VendorBulkImport.tsx`.
- `supabase/functions/bulk-vendor-import/index.ts`: remove the `create_vendors` and `attach_media` action branches and their helper functions. Keep `requireAdmin`, corsHeaders (already fixed), the top-level try/catch, and `send_registration_sms` / `release_to_public` / `get_login_status` completely unchanged.

The edge function keeps its current name (`bulk-vendor-import`) — renaming would touch `supabase/config.toml` and risk breaking deployment; the actions inside it are what matter.

## 2. Extract the real vendor form into a shared component

Create `src/components/vendors/VendorProfileForm.tsx` by lifting the form out of `VendorOnboarding.tsx`:

- All fields: name, category, address block, about, `price_range_text`, languages, social URLs, `is_registered_business` conditional (registered name / reg number / VAT + verification doc pickers), banking block.
- Logo + showcase gallery pickers with existing upload logic (same `vendor-images` bucket paths, same `vendor_verification_documents` insert).
- Province gate + waitlist behavior preserved.

Props:

```ts
type Props = {
  ownerUserId: string;
  signupSource?: string;           // defaults to 'vendor_self_signup'
  mode?: 'create' | 'edit';        // defaults to 'create'
  existingVendor?: Vendor | null;  // pre-fills fields when mode='edit'
  onCreated: (vendorId: string) => void;
};
```

- In `create` mode: direct `supabase.from('vendors').insert({ ..., owner_user_id: ownerUserId, is_active: false, signup_source })`. The existing "Admins can create vendors" RLS policy (`WITH CHECK has_role(auth.uid(),'admin')`) allows admins to insert with a different `owner_user_id`; self-signup vendors still satisfy the standard owner policy since `ownerUserId === auth.uid()`. **No RLS changes.**
- In `edit` mode: pre-fill from `existingVendor`, and on submit `update` the row + append newly-picked uploads (don't wipe existing `image_urls`).
- All internal `user.id` / `useMyVendorProfile` references replaced with `ownerUserId` / `existingVendor` props. The component does not call `useAuth` for identity.

Refactor `src/pages/vendors/VendorOnboarding.tsx` to render:

```tsx
<VendorProfileForm
  ownerUserId={user.id}
  signupSource="vendor_self_signup"
  onCreated={(id) => navigate('/profile/vendor')}
/>
```

Preserve the existing page chrome (PageHeader, quick-mode phone capture in step 4→5 flow, `justCreated` guard, redirects). Real vendor self-signup must look and behave identically.

## 3. New edge function action: `create_vendor_account`

Added to `bulk-vendor-import/index.ts` behind the same admin gate:

- Input: `{ action: "create_vendor_account", name: string, phone_number: string }`.
- Normalize phone with the existing helper.
- Check `profiles.phone_number` for a match → return `{ error: "phone_already_registered" }` with 409 if found.
- Otherwise: `admin.auth.createUser({ email: shadow, password: random, phone_confirm: true })` + insert `profiles { user_id, phone_number, full_name: name }`. Identical logic to what `create_vendors` used for these steps.
- Return `{ user_id }`.

No vendor row is created here — that happens when the admin submits `VendorProfileForm`.

## 4. New admin page: `src/pages/admin/VendorUpload.tsx`

Route `/admin/vendor-upload` under the existing `AdminGuard`/`AdminLayout`. Sidebar entry "Vendor Upload" replaces the removed "Bulk Import" item (same `Upload` icon).

Two views via tabs:

**New Vendor**

1. Small step: name + phone inputs, "Create Account" button → invokes `create_vendor_account`.
2. On success, reveal `<VendorProfileForm ownerUserId={returned user_id} signupSource="admin_manual" onCreated={...} />` beneath.
3. Once `onCreated` fires (vendor row exists), show per-row actions: Release to Vendor (SMS via `send_registration_sms`), Release to Public (via `release_to_public`), and the login-status badge (via `get_login_status`) — same non-blocking behavior already built.

**Manage Vendors**

- Table of vendors where `signup_source = 'admin_manual'`, ordered `created_at DESC`.
- Columns: name, phone, category, Media status (computed inline: `logo_url` present or `image_urls.length > 0`), Release-to-Vendor status, Release-to-Public status (from `is_active`), login-status badge.
- Per-row buttons: Release to Vendor, Release to Public, "Edit / Add Media" (opens `VendorProfileForm` in `mode="edit"` with the row's data — appends uploads rather than replacing).
- Bulk actions optional: keep only if trivial; row-level is the requirement.

## Out of scope

- Real vendor self-signup UX must remain visually and behaviorally identical after the refactor.
- No RLS changes; no changes to `reset-password`, `seed-demo-users`, or other auth functions.
- No new edge function; new action is added to the existing `bulk-vendor-import` function.

## Technical notes

- The RLS policy `Admins can create vendors` already permits an admin to insert a vendor row where `owner_user_id` is another user — this is what makes the client-side insert from `VendorProfileForm` work for admins without a service-role round-trip.
- `signup_source` values used: `'vendor_self_signup'` (existing) and `'admin_manual'` (new). Manage Vendors filters on the latter.
- Login-status, SMS release, and public release paths are all unchanged edge-function actions; the admin UI is a thin wrapper over them.
