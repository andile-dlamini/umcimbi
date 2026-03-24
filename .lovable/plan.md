

## Plan: Fix Back Button Navigation

4 changes across 6 files.

### Fix 1: ArticleDetail — use history back
`src/components/learn/ArticleDetail.tsx` line 22: change `navigate('/learn')` → `navigate(-1)`

### Fix 2: PageHeader — add `backTo` prop
`src/components/layout/PageHeader.tsx`:
- Add `backTo?: string` to props interface
- Update onClick: `onClick={() => backTo ? navigate(backTo) : navigate(-1)}`

### Fix 3: Remove `showBack` from top-level nav pages
- `src/pages/vendor-dashboard/VendorDashboard.tsx` — already has no `showBack` ✓
- `src/pages/bookings/ClientBookings.tsx` lines 134, 146 — remove `showBack`
- `src/pages/vendor-dashboard/VendorBookings.tsx` lines 94, 106 — remove `showBack`
- `src/pages/quotes/MyQuotes.tsx` lines 120, 132 — remove `showBack`

### Fix 4: EventDashboard Guide tab
No change needed — article links already use standard `navigate()` which correctly records history for `navigate(-1)`.

