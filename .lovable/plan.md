# Show a vendor's service areas on their card

Vendor cards and tiles will show the vendor's declared service regions (first region name, plus a "+N more" count when there are several). Vendors who have not declared any regions keep showing their free-text location as before.

## What changes on screen

- Vendor cards (public directory, signed-in browse lists): the line under the vendor name shows the first service area name instead of the location text when the vendor has declared service areas, with a muted `+N more` suffix. No service areas declared → the location text shows as today. Neither → nothing.
- Vendor tiles (landing page browser, carousel): the meta line under the name gets ` · <area>` from the same rule, with the ` +N more` suffix.
- Everything else on the cards (about text, ratings, distance, images, click behaviour) is unchanged.

## Technical detail

1. `src/hooks/useVendors.ts` — add exported `fetchVendorRegionNames(): Promise<Map<string, string[]>>` alongside the existing `fetchVendorRegionMap` (which is not touched). It queries `vendor_service_regions` selecting `vendor_id` and the related `service_regions(name, display_order)` (the FK to `service_regions` exists, so PostgREST can embed it), and returns a Map of vendor id to region names sorted by `display_order`. On error: console log and return an empty Map.
2. `src/hooks/useVendors.ts` (`useVendors`) and `src/hooks/useVendorsWithDistance.ts` — add `fetchVendorRegionNames()` to the existing `Promise.all` next to the vendor query, and attach `service_region_names: string[]` (empty array when absent) to each row. Filtering and sorting behaviour unchanged; the two files keep the same implementation shape.
3. `src/pages/vendors/PublicVendorsList.tsx` — same: add to the existing `Promise.all` and attach `service_region_names` to each row.
4. `src/components/vendors/VendorBrowser.tsx` — imports `fetchVendorRegionNames` from `@/hooks/useVendors`, calls it alongside the existing directory query (it currently selects a narrow column list; region names come only from the new fetch, the query itself is unchanged), and attaches `service_region_names` to each result row before the shuffle.
5. `src/lib/vendorCategories.ts` — add exported helper:

   ```ts
   export function formatServiceAreas(names: string[] | undefined, fallback: string | null): { text: string; more: number } | null
   ```

   Rules: names with ≥1 entry → `{ text: names[0], more: names.length - 1 }`; else non-empty fallback → `{ text: fallback, more: 0 }`; else `null`.
6. `src/components/shared/VendorCard.tsx` — replace the `{vendor.location && ...}` block with `formatServiceAreas(vendor.service_region_names, vendor.location)`. Null → render nothing; otherwise same MapPin icon and layout, showing `text`, with a muted ` +${more} more` suffix in the style VendorTile already uses for truncated categories. The `vendor` prop type gains the optional `service_region_names?: string[]` field.
7. `src/components/vendors/VendorTile.tsx` and `src/components/vendors/VendorCarousel.tsx` — add `service_region_names?: string[]` to `VendorTileData` (Carousel passes it through via the shared type, no logic change). VendorTile replaces the `{vendor.location ? ` · ${vendor.location}` : ''}` expression with the same helper result: ` · ${text}` plus ` +${more} more` when `more > 0`, nothing when null.

## Unchanged

About-text rendering, ratings, distance, images, click handling, region filtering/sorting logic, all query filters, `fetchVendorRegionMap` and `applyRegionFilterAndSort`. No database migration.

## Verification

Typecheck plus the preview build, then a quick browser check that a vendor with declared regions shows the area name on the card and a vendor without any still shows their location.
