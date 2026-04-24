# Plan: Rename Tabs & Expand Booking Statuses (5 Files)

Apply the exact verbatim replacements provided. No other changes.

## Files & Changes

### 1. `src/pages/quotes/MyQuotes.tsx` (Client quotes)
- Rename filter vars: `pendingQuotes` → `decideQuotes`, `otherQuotes` → `closedQuotes`.
- Rename tabs: **Pending** → **Decide**, **Other** → **Closed**.
- Default tab: `decide`.
- Empty state for Decide: "No quotes awaiting your decision".

### 2. `src/pages/vendor-dashboard/VendorQuotations.tsx` (Vendor quotes)
- Rename filter var: `pendingQuotes` → `awaitingClientQuotes`.
- Rename tabs: **Pending** → **Awaiting Client**, **Other** → **Closed**.
- Default tab: `awaiting`.
- Empty states updated accordingly.

### 3. `src/pages/bookings/ClientBookings.tsx` (Client bookings)
- Split `activeOrders` into `paymentDueOrders` (pending_deposit OR confirmed+balance due) and `upcomingOrders` (confirmed + balance not due).
- Rename `otherOrders` → `cancelledOrders`.
- Tabs become 4 columns: **Payment Due | Upcoming | Completed | Cancelled**.
- Default tab: `payment-due`.

### 4. `src/pages/vendor-dashboard/VendorOrders.tsx` (Vendor orders)
- Same 4-tab split as File 3: **Payment Due | Upcoming | Completed | Cancelled**.
- `markJobCompleted` action remains on Payment Due and Upcoming cards.
- Default tab: `payment-due`.

### 5. `src/pages/events/tabs/BookVendorsTab.tsx`
- Expand `BookingStatus` union from 3 states to 6: `not_started | quote_requested | quote_received | deposit_due | upcoming | balance_due`.
- Reclassify per-category status using booking_status + balance_status + service_request status, with priority: deposit_due → balance_due → upcoming → quote_received → quote_requested → not_started.
- Update dot colors, badge classes, and badge labels for each new status.
- `orderedCount` now counts categories where status is `upcoming` or `balance_due`.

## Notes
- All replacements are exact text swaps as specified in the user message.
- No new imports required; `balance_status` already exists on booking objects.
- No DB or type changes.

Approve to apply.