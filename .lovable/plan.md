# Admin quotations funnel

An admin-only view of every quote in the system, with a derived funnel stage, summary totals and filters.

## 1. Shared stage helper — `src/lib/quoteFunnel.ts`

New file exporting:

- `FUNNEL_STAGES` — ordered stage list: Requested, Quoted, Accepted, Deposit paid, Completed, Disputed, Lost.
- `getQuoteStage({ quoteStatus, requestStatus, bookingStatus, depositStatus })` — evaluated furthest-first so a booking that reached deposit never reports as Quoted:
  1. `booking_status = disputed` → Disputed
  2. `booking_status = completed` → Completed
  3. `deposit_status = paid` or `booking_status = confirmed` → Deposit paid
  4. quote `client_accepted` (no booking, or booking `pending_deposit`) → Accepted
  5. quote `client_declined` / `expired`, or request `declined` / `vendor_declined` / `expired` / `cancelled` → Lost
  6. quote `pending_client` / `adjustment_requested` → Quoted
  7. request `pending` with no quote → Requested
- A stage → badge-variant/colour map so the UI does not invent its own.

## 2. Page — `src/pages/admin/AdminQuotations.tsx`

Layout, table styling, skeleton loading and empty states copied from `AdminOperations.tsx`.

Single query on `public.quotes` (normal client, admin RLS) selecting:
`id, offer_number, price, created_at, status, final_offer_pdf_key`, plus
`vendor:vendors(id, name, category)` (base table, so deactivated vendors still resolve),
`request:service_requests(id, status, requester_user_id, event:events(id, name, type))`.
Bookings are fetched in a second lookup by `quote_id` and mapped in (bookings are not a reverse FK-friendly join here), and requester names come from a `profiles` lookup on the collected `requester_user_id` list. Sorted newest first.

Columns: Reference (offer_number), Ceremony (event type label), Category (`getVendorCategoryLabel`), Organiser, Vendor, Amount (R currency), Stage badge, Sent date, Actions → "View quote" via existing `viewQuotePdfAction` when `final_offer_pdf_key` is set.

## 3. Summary

- Row of cards: count + total value per stage in funnel order, plus a grand total card.
- Below: category breakdown (count + total value per vendor category present), sorted by value descending.
- Both computed from the filtered rows, so all figures respect active filters.

## 4. Filters

Stage select, category select from `LIVE_VENDOR_CATEGORY_FILTER_OPTIONS`, and a free-text search across vendor name, organiser name and offer number. Applied once to a memoised filtered list feeding both table and summary.

## 5. Routing and nav

- `src/App.tsx`: add `<Route path="quotations" element={<AdminQuotations />} />` inside the existing `/admin` route (already wrapped in `AdminGuard` + `AdminLayout`).
- `src/components/admin/AdminSidebar.tsx`: add a "Quotations" nav item with a receipt/file icon.

## Out of scope

No RLS, database function, view or migration changes. No changes to `quoteActions.ts`, document edge functions, `MyQuotes.tsx`, `CompareQuotes.tsx`, the vendor quotations page, payments/payout/escrow/SMS code, or `AdminGuard`.

## Verification

Check the list returns quotes from other requesters, that a stage badge matches the underlying rows for each stage present in the data, that totals shift when a filter is applied, that an inactive vendor's name still renders, and that `/admin/quotations` redirects a non-admin to `/`.
