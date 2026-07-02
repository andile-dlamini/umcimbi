## Admin Dashboard — Vendor Responsiveness KPI + Ceremony Pipeline

### 1. Migration (new file under `supabase/migrations/`)

Create two admin-gated SECURITY DEFINER RPCs exactly as specified:

- **`public.get_stalled_conversations(hours_threshold int DEFAULT 2)`** — returns conversations where the last message is from the planner (`sender_type = 'user'`) and `last_message_at` is older than the threshold. Joins vendors, profiles, events. Admin gate via `has_role(auth.uid(), 'admin')` inside the WHERE. `GRANT EXECUTE ... TO authenticated`.
- **`public.get_ceremony_pipeline()`** — returns per-event counts of `service_requests`, `quotes` (via `quotes.request_id = sr.id`), and a `has_booking` boolean for `booking_status IN ('confirmed','completed','disputed')`. Admin-gated the same way. `GRANT EXECUTE ... TO authenticated`.

No changes to RLS on `messages`, `conversations`, `events`, `quotes`, `bookings`, or `service_requests` — the RPCs are the only new access path.

### 2. `src/pages/admin/AdminDashboard.tsx`

**State additions**
- `stalledConversations`, `stalledCount`
- `ceremonyPipeline`
- Remove `eventsByType`, `totalEvents` and their `setState` calls.

**`fetchAll` additions**
- Call `rpc('get_stalled_conversations', { hours_threshold: 2 })` → populate stalled state.
- Call `rpc('get_ceremony_pipeline')` → populate pipeline state.
- Remove the existing `events` fetch that built `eventsByType`.

**Growth cards strip**
- Append a 6th card: **"Awaiting vendor reply"** using `stalledCount`. No prev-period row (conditionally hide the "prev. period" line for this card only).

**New "Vendors to nudge" Card** (below the growth grid, above SMS balance)
- Empty state: "No vendors are behind on replies right now."
- List rows: vendor name + phone, planner name, ceremony name + type label, hours since last message, truncated (~80 char) preview of the planner's last message.
- Order preserved from RPC (soonest-stalled first).

**Replace "Ceremonies by Type" Card with "Ceremony pipeline" Card**
- Remove the existing "Ceremonies by Type" Card entirely; keep "Vendors by Category" untouched. The two-column `grid lg:grid-cols-2` becomes a stacked layout: pipeline Card full-width on top, "Vendors by Category" below (or restructure so pipeline sits where "by Type" was — using single-column since the pipeline is a wide table).
- Table columns: Ceremony (name + `eventTypeLabels[type]`), Date (formatted, or "—"), Requests sent, Quotes received, Status.
- Status badge logic:
  - `has_booking` → "Booked" (green)
  - `requests_sent = 0` → "No requests sent" (grey)
  - `requests_sent > 0` and `quotes_received = 0` → "Awaiting vendor response" (amber)
  - `quotes_received > 0` and not booked → "Quoted, not booked" (blue)
- Urgency flag: if `event_date` is set, within next 14 days, and status ≠ "Booked" → left border accent (e.g. `border-l-4 border-l-amber-500`) on that row.
- Sort order preserved from RPC (soonest first, undated last).

### 3. Explicitly untouched
Revenue strip, Bookings confirmed, Quotes pending, existing growth cards, Vendors by Category chart, funnel, SMS balance card, AI daily brief, all other files/functions/policies.

### Notes
- Migration runs first (RPCs must exist before the client calls them).
- Types file will regenerate post-migration; RPC calls use `(supabase as any).rpc(...)` per existing pattern in the file.
