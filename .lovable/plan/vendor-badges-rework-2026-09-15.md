# Vendor badges rework

Rename the existing badge, add two earned badges, and remove the dead Super Vendor filter.

## Badges

- **Registered Business** — shown when the vendor's verification status is `verified`. Existing blue `BadgeCheck` icon. Tooltip: "Registered Business – UMCIMBI has verified this vendor's company registration documents"
- **Ceremonies completed** — shown when completed bookings > 0. `PartyPopper` icon in a distinct colour, with the count rendered next to it as small text. Tooltip: "This vendor has completed N ceremonies booked through UMCIMBI", singular "1 ceremony".
- **Responds quickly** — shown when the vendor usually replies within a day. `Zap` icon in a third distinct colour. Tooltip: "This vendor usually replies to quotation requests within a day"

All three render side by side in the existing inline-flex container with the same tooltip pattern and icon sizing. Returns nothing when none apply.

## Where the numbers come from

Bookings and enquiries are private per account, so a browser query would return only the signed-in person's own rows and the badges would stay blank. A read-only database function returns the two figures per vendor, safe to expose publicly.

## Changes

1. **Migration** — `public.get_vendor_public_stats()`, a stable security-definer SQL function returning `vendor_id`, `completed_bookings`, `responds_quickly`. Completed bookings counted from `bookings` where status is `completed`. `responds_quickly` is true when a vendor has at least 2 responded service requests and the median hours between `created_at` and `responded_at` is 24 or less. Execute revoked from public, granted to `anon` and `authenticated`.

2. **`src/hooks/useVendors.ts`** — new exported `fetchVendorBadgeStats(): Promise<Map<string, { completedBookings: number; respondsQuickly: boolean }>>` alongside `fetchVendorRegionNames`, implemented by calling `supabase.rpc('get_vendor_public_stats')`. On error, log to console and return an empty Map.

3. **Attach the stats** exactly as `service_region_names` is attached today — add `fetchVendorBadgeStats()` to the existing `Promise.all` in `useVendors`, `useVendorsWithDistance`, `PublicVendorsList` and `VendorBrowser`, setting `completed_bookings` (default 0) and `responds_quickly` (default false) on each row.

4. **Call sites** — `VendorCard.tsx` (line 80), `VendorDetail.tsx` (line 304), `VendorProfile.tsx` (line 288), `Settings.tsx` (line 216): pass `completedBookings` / `respondsQuickly` where the row carries them, omit where not loaded, and drop every `isSuperVendor` prop.

5. **`VendorsList.tsx`** — remove the "Super Vendors" toggle, its state, its use in the hook filters, its entry in the tracking metadata, and its reset in "Clear all filters". `useVendorsWithDistance.ts` drops the `superVendorsOnly` filter handling; `useVendors.ts` has no such filter, so nothing to remove there.

Unchanged: region filtering and sorting, the search sanitiser, pagination, the unmet-demand form, and all other behaviour.
