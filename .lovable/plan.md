## Plan

### File 1: `src/hooks/useVendors.ts`
Add a new exported hook `useSavedVendors` after the existing hooks.

**Query:** Join `saved_vendors` with `vendors` on `vendor_id`, selecting `vendors(id, name, category, image_urls, rating, review_count)` and filtering `saved_vendors.user_id = auth.uid()`.

**State:** `savedVendors` array, `isLoading` boolean.

**Functions:**
- `toggleSave(vendorId)`: if `isSaved(vendorId)` is true, `delete().eq('user_id', uid).eq('vendor_id', vendorId)` then refetch. Otherwise `insert({ user_id, vendor_id })` then refetch.
- `isSaved(vendorId)`: checks if `vendorId` exists in the fetched `savedVendors` list.
- `refetch`: re-runs the join query.
- Guarded: only executes when `user` is present (authenticated).

**Returns:** `{ savedVendors, isLoading, toggleSave, isSaved }`

### File 2: `src/pages/Home.tsx`
Add a "Saved vendors" horizontal-scroll section between the events hero/plan-next block and the Quick Actions grid.

**Imports:** Add `Heart` from lucide-react (already imported) and import `useSavedVendors` from the hook.

**Placement:** After the `nextEvent ? <NextEventHeroCard...>` block and before the Quick Actions grid.

**Visibility:** Only renders when `savedVendors.length > 0`.

**Layout:**
- Section header row: `<Heart className="h-4 w-4 text-red-500" />` + "Saved vendors" text + a "See all" text link that navigates to `/vendors`.
- Horizontal scroll container (`overflow-x-auto flex gap-3 pb-1`) of compact inline cards.
- Each card is a clickable div that navigates to `/vendors/${vendor.id}`:
  - Square thumbnail: `w-[72px] h-[72px] rounded-lg object-cover` from `vendor.image_urls[0]` with a fallback.
  - Vendor name: `text-xs font-medium truncate max-w-[72px]`.
  - Category badge: `text-[11px]`.

**No new component files** — vendor card stays inline in Home.tsx.

### Out of scope
- No changes to any other files (vendor list page, vendor detail, onboarding, etc.).
- No migrations (saved_vendors table and RLS already exist).