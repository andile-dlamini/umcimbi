# Badge stats + service areas on the vendor detail page

Bring the vendor detail page in line with the browse cards: same badge data, same service-area display, and drop the misleading "events" stat.

## Current state (verified)

- `useVendor(id)` in `src/hooks/useVendors.ts` fetches only the vendor row — no badge stats, no service-region names, so the detail page can't show either.
- `VendorDetail.tsx` shows a `Briefcase` "N events" stat (`added_to_events_count`, a different number than completed bookings, contradicting the new badge), a raw `vendor.location` line, and `<VendorBadges>` with only `businessVerificationStatus`.
- `VendorProfile.tsx` (owner's view) renders `<VendorBadges>` without the two earned badges, and its location line ignores the service areas it already loads (`serviceRegionNames` state exists).
- `Settings.tsx` renders `<VendorBadges>` without the two earned badges; `vendorStats` doesn't carry them.

## Changes

1. **`src/hooks/useVendors.ts` — `useVendor(vendorId)`**: inside the existing fetch, run `fetchVendorBadgeStats()` and `fetchVendorRegionNames()` in parallel with the single-vendor query, and attach `completed_bookings` (default 0), `responds_quickly` (default false) and `service_region_names` (default []) to the returned vendor object. Query and return shape otherwise unchanged.

2. **`src/pages/vendors/VendorDetail.tsx`**:
   - Delete the `Briefcase` "N events" stat block (lines 322–325) and the now-unused `Briefcase` import.
   - Replace the `vendor.location` block (lines 326–331) with `formatServiceAreas(vendor.service_region_names, vendor.location)` — keep the existing `MapPin` icon and layout, append a muted ` +N more` when `more > 0`, render nothing when the helper returns null (same pattern as `VendorCard.tsx`).
   - Pass `completedBookings={vendor.completed_bookings}` and `respondsQuickly={vendor.responds_quickly}` to the existing `<VendorBadges />` call.

3. **`src/pages/profile/VendorProfile.tsx`**:
   - Location line: render `formatServiceAreas(serviceRegionNames, vendor.location)` instead of the raw location (the region names are already loaded in state — no new fetch).
   - Badges: fetch `fetchVendorBadgeStats()` once when the vendor loads, look up this vendor's entry, and pass `completedBookings` / `respondsQuickly` to `<VendorBadges>`.
   - The private "Jobs done" stat card stays as is (owner-only, different purpose).

4. **`src/pages/Settings.tsx`**: in the existing `vendorStats` effect, also call `fetchVendorBadgeStats()` and merge this vendor's `completed_bookings` / `responds_quickly` into the state; pass both to `<VendorBadges>`. No location line exists here — nothing else to change.

## Not touched

Review section, photo gallery, quotation button, event-linking dropdown, region filtering/sorting, search sanitiser, any database object or other behaviour.
