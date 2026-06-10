Two small admin UI updates to surface the manual vendor approval workflow.

1. Rename sidebar item
   File: `src/components/admin/AdminSidebar.tsx`
   - Change the nav item label from "Verification Queue" to "Vendor Approvals". Route and icon (`BadgeCheck`) stay the same.

2. Add "Pending vendors" card to Admin Overview
   File: `src/pages/admin/AdminDashboard.tsx`
   - Add `pendingVendors` state (number) and fetch it alongside the other metrics.
   - Query: count vendors where `is_active = false`, `is_demo = false`, `is_banned = false` — matching the existing `VendorVerificationQueue` filter.
   - Add a new card to the "Real account statistics" grid (right after the existing vendor/organiser cards, or in its own row) showing:
     - Label: "Pending vendors"
     - Count value
     - Icon: `BadgeCheck`
     - The card is clickable and navigates to `/admin/verification-queue`
   - Follow the existing card styling (border-l-4, icon in colored circle, skeleton loading state).