# Add /update-service-areas route that opens vendor profile at service-areas in edit mode

## What we're building
A short redirect route `/update-service-areas` that sends a vendor straight to the service-areas section of their profile, already in edit mode. This is useful for recovery links (e.g. from the SMS campaign) that want to nudge the vendor to finish their service areas.

## Files to change

### 1. New file: `src/pages/vendors/UpdateServiceAreas.tsx`
Create a small routing component that mirrors `src/pages/vendors/CompleteProfile.tsx`:
- Same imports, loading state, `useAuth`, `useSearchParams`, `ref` preservation via `encodeURIComponent`, and `cancelled` flag.
- After `isLoading` resolves:
  - No user → navigate to `/auth?redirect=/update-service-areas` + preserved ref, `replace: true`.
  - User present → query `vendors` for a row where `owner_user_id = user.id`, selecting only `id`, using `maybeSingle()`.
    - Row exists → navigate to `/profile/vendor?edit=1#service-areas`, `replace: true`.
    - No row → navigate to `/complete-profile` + preserved ref, `replace: true`.
    - On error → log to console and navigate to `/vendor-dashboard`, `replace: true`.

### 2. `src/App.tsx`
- Import `UpdateServiceAreas` alongside the other page imports.
- Register `<Route path="/update-service-areas" element={<UpdateServiceAreas />} />` in the logged-out `<Routes>` block, right after `/complete-profile`.
- Register the same route in the logged-in `<Routes>` block (inside `AppShell`), right after `/complete-profile`.

### 3. `src/pages/profile/VendorProfile.tsx`
- Read the URL search params.
- When `edit` equals `'1'`, the vendor has loaded, and `isEditing` is false, call `startEditing()` exactly once on mount. Use a ref or state flag to prevent re-triggering after the user cancels editing.
- Add `id="service-areas"` to the wrapper element around the `<VendorServiceRegions />` block so the hash anchor scrolls to it.
- Do not change `startEditing`, `handleSave`, service-region persistence, the read-only view, or any other behaviour.

## Not in scope
- No changes to `AuthPage.tsx`, `CompleteProfile.tsx`, `VendorServiceRegions.tsx`, or any other file.
- No database migration.

## Verification
- Typecheck with `npx tsgo --noEmit -p tsconfig.app.json`.
- Build log check at `/tmp/observability/build-errors.log`.
