

## Plan: Admin Dashboard Overhaul — 5 Targeted Changes

### Summary
Rewrite the admin Overview page with revenue KPIs, growth signals, a conversion funnel, and period filtering. Create a new Revenue page with charts. Enhance Operations with three new queue cards. Add sidebar nav item and route.

### Changes

**1. Rewrite `src/pages/admin/AdminDashboard.tsx`**
- Add period selector (week/month/all, default month) with toggle buttons in page header
- Tier 1: 4 revenue cards (GMV, platform revenue, escrow, avg booking) with left border accent — query bookings with status filter
- Tier 2: 4 growth signal cards (new organisers, ceremonies, requests, bookings) with previous-period comparison
- Tier 3: Full-width conversion funnel card ("Organiser journey") — always all-time, 4 horizontal bars with decreasing opacity
- Tier 4: Keep existing Ceremonies by Type and Vendors by Category charts as-is
- Remove Waitlist card
- Skeleton loading states on all cards

**2. Create `src/pages/admin/AdminRevenue.tsx`**
- 4 summary KPI cards (all-time: GMV, platform revenue, escrow, avg booking)
- Revenue over time: BarChart (8 weeks, grouped by ISO week) using ChartContainer — two bars per week (GMV + platform revenue)
- GMV by ceremony type: horizontal BarChart joining bookings+events
- Bookings by status: vertical BarChart with all 5 statuses
- 3 payout summary cards (paid to vendors, in escrow, pending release via delivery_proofs)
- All skeleton states, R formatting

**3. Rewrite `src/pages/admin/AdminOperations.tsx`**
- Keep existing Disputed Bookings card unchanged
- Add "Proof not uploaded" card: bookings confirmed, past event date by 24h, no matching delivery_proof
- Add "Stuck releases" card: delivery_proofs older than 50h where funds not released
- Add "Vendor verifications pending" card: count of vendors with pending verification, link to queue

**4. Update `src/components/admin/AdminSidebar.tsx`**
- Add `{ label: 'Revenue', to: '/admin/revenue', icon: DollarSign }` as second item after Overview
- Import DollarSign from lucide-react

**5. Update `src/App.tsx`**
- Import AdminRevenue
- Add `<Route path="revenue" element={<AdminRevenue />} />` inside the admin layout route group

### Files Changed
| File | Action |
|------|--------|
| `src/pages/admin/AdminDashboard.tsx` | Rewrite |
| `src/pages/admin/AdminRevenue.tsx` | Create |
| `src/pages/admin/AdminOperations.tsx` | Rewrite |
| `src/components/admin/AdminSidebar.tsx` | Edit (add nav item) |
| `src/App.tsx` | Edit (add route + import) |

### No changes to
AdminLayout, AdminTopBar, AdminGuard, AdminSettings, AdminWaitlist, VendorVerificationQueue, SuperVendorManagement, BulkVendorUpload, or any non-admin files.

