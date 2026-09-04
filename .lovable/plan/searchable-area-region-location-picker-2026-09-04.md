# Searchable area/region location picker

Replace the free-text location box on the vendor browsing pages with a searchable picker backed by the service regions and areas taxonomy. Typing an area (e.g. a township or town) selects the region that serves it, and vendors are filtered by declared service region.

## What changes

1. **New picker component** (`src/components/vendors/LocationCombobox.tsx`)
   - Controlled combobox built on the existing Command + Popover UI, with a map-pin trigger showing the selected label or the placeholder ("Where is your ceremony?").
   - Loads all regions and areas (ordered by display order) on mount; read-only, no writes.
   - Empty query: shows only the 10 regions under a "Regions" heading.
   - Typing: matches regions by name and areas by name or alias (case-insensitive substring). Regions listed first, then areas; each area row shows its region name beneath in small muted text.
   - Results capped at 8, scrollable. "Clear" option appears when a value is selected.
   - Selecting a region returns its id + name; selecting an area returns the area's region id with the area name as the label.
   - Query of 3+ characters with no matches renders "No matching area" and calls `onNoMatch` with the typed text.

2. **Vendor hooks** (`src/hooks/useVendorsWithDistance.ts`, `src/hooks/useVendors.ts`) — identical implementation in both
   - Filter type: `location: string` becomes `regionId?: string | null`; all other filters unchanged. The `.ilike('location', ...)` call is removed.
   - Alongside the vendor query, fetch all `vendor_service_regions` rows and build a vendor to region-set map.
   - When `regionId` is set, keep vendors that serve that region, plus vendors with no declared regions at all (treated as serving everywhere).
   - Always sort vendors with at least one declared region ahead of those with none, preserving the existing review-count ordering inside each group.

3. **`src/pages/vendors/VendorsList.tsx`**
   - Text location input replaced by the combobox; selection held as `{ regionId, label } | null` and passed to the hook as `regionId`.
   - Analytics keeps sending a `location` value: the selected label, or the raw typed text when `onNoMatch` fires. `search_zero_results` continues to fire as today.
   - With a location selected, a small muted line above the results reads "Showing vendors serving <region name>".
   - "Clear all filters" also clears the location selection.

4. **`src/pages/vendors/PublicVendorsList.tsx`**
   - Same swap against `vendors_directory_public`: combobox instead of the text input, `.ilike('location', ...)` removed, same client-side region match and ordering.
   - The existing `location` URL search param is preserved by storing the selected label in it.

## Technical notes

- `vendor_service_regions` has no PostgREST relationship to the marketplace/public views, so the region match runs client-side against a small extra fetch.
- Unchanged: category filter, search filter and its sanitiser, the KwaZulu-Natal `state_province` filter, `HIDDEN_VENDOR_CATEGORIES`, verified and super-vendor toggles, pagination, the unmet-demand form, and `CeremonyMode.tsx` (it calls `useVendors()` with no filters, so the type change is safe).
- No database migration required.
