# Fix Admin Dashboard undercounts + add Quotes pending card

## Bug 1 — Missing admin RLS SELECT policies

New migration adding admin-scoped SELECT policies mirroring the existing `bookings` pattern:

```sql
CREATE POLICY "Admins can view all events" ON public.events
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all service requests" ON public.service_requests
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all quotes" ON public.quotes
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
```

Fixes silent undercounts on "New ceremonies", "Requests sent", and the new "Quotes pending" card caused by owner-scoped RLS filtering out rows the logged-in admin doesn't own.

No changes to existing policies, grants, or other tables.

## Bug 2 — Add "Quotes pending" growth card

Edit `src/pages/admin/AdminDashboard.tsx` only:

1. Add state:
   - `pendingQuotes` / `setPendingQuotes`
   - `prevPendingQuotes` / `setPrevPendingQuotes`

2. In `fetchAll`, alongside the existing growth `fetchCount` calls:
   ```ts
   setPendingQuotes(await fetchCount('quotes', '*', start, { status: 'pending_client' }));
   ```

3. In the previous-period block (`period !== 'all'`), add the matching `fetchPrevCount` call with `{ status: 'pending_client' }` and call `setPrevPendingQuotes(...)`. In the else branch, reset it to 0 alongside the other prev counters.

4. Append to `growthCards`:
   ```ts
   { label: 'Quotes pending', current: pendingQuotes, prev: prevPendingQuotes }
   ```

Existing grid `grid-cols-2 lg:grid-cols-4` reflows naturally for the 5th card — no layout class change.

## Explicitly untouched
- Tier 1 revenue strip (GMV, platform revenue, escrow, avg booking)
- Bookings confirmed card
- Funnel, distribution charts, SMS balance, AI daily brief
- All other files and edge functions
