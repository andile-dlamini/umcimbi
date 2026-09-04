# Service-regions selector for vendor profile + admin vendor edit

Add a shared "Service areas" region picker so vendors and admins can record which KZN regions a vendor serves, backed by the existing `service_regions` / `service_areas` / `vendor_service_regions` tables. No database changes.

## 1. New component: `src/components/vendors/VendorServiceRegions.tsx`

A controlled, self-contained component.

- Props: `vendorId: string | null`, `value: string[]` (region ids), `onChange: (ids: string[]) => void`, optional `disabled: boolean`.
- On mount: load all `service_regions` (ordered by `display_order`) and all `service_areas` (ordered by `display_order`). Show "Loading regions..." while fetching.
- Renders:
  - Label: "Service areas"
  - Helper text (`text-xs text-muted-foreground`): "Select the regions you serve. You will appear in searches for any area in the regions you choose."
  - Full-width checkbox row "I serve all of KwaZulu-Natal" — checks every region / clears all; shows checked when every region is selected.
  - Grid of region checkboxes using the exact markup of the "Additional services" grid in `VendorProfile.tsx` (`grid grid-cols-1 sm:grid-cols-2 gap-2`, label `flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer`, shadcn `Checkbox`).
  - Under each region name, its areas joined with ", ", truncated to the first 6 plus "…", styled `text-xs text-muted-foreground`.
- Optional selection, no validation. No DB writes — read-only reference data, reports selection via `onChange`.

## 2. `src/pages/profile/VendorProfile.tsx`

- New `serviceRegionIds: string[]` state, plus a stored list of region names for the read-only view.
- `startEditing()`: query `vendor_service_regions` for `vendor.id` and populate `serviceRegionIds`.
- Render `<VendorServiceRegions vendorId={vendor.id} value={serviceRegionIds} onChange={setServiceRegionIds} />` in the edit block, after the "Address" field, before "About".
- `handleSave()`: after `updateVendorProfile()` succeeds, delete existing `vendor_service_regions` rows for the vendor and insert one row per selected id. On error: `console.error` + toast "Profile saved, but service areas could not be updated". Never block or revert the profile save.
- Read-only view: if the vendor has regions, show them as a comma-separated list under a "Service areas" label, matching the existing read-only field styling.

## 3. `src/components/vendors/VendorProfileForm.tsx`

- Render `<VendorServiceRegions />` only when `mode === 'edit'`, immediately after the "Business Address" `h3`/`AddressFields` block (line ~642). Not rendered in `create` mode.
- When `mode === 'edit'`, load existing `vendor_service_regions` rows for `existingVendor.id` into local state.
- In `handleSubmit`, after the vendors update succeeds and `vendorId` is known: delete-then-insert the vendor's region rows with the same error handling (console error + non-blocking toast).

## Explicitly unchanged

- Zod schema, `AddressFields`, `vendorPayload`, image/document upload, bank details, social links, category selection, `PricingInput`, delete-profile logic, all validation.
- `VendorOnboarding.tsx` and the `mode="create"` call sites in `VendorUpload.tsx`.
- No migration.

## Verification

- Typecheck passes.
- Edit a vendor profile (both pages), toggle regions incl. "all of KZN", save, and confirm `vendor_service_regions` rows match; confirm a failing insert only toasts and the profile still saves.
- Confirm the selector does not appear in create mode.
