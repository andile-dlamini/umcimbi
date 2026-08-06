# Fix admin dashboard metric values

Scope: `src/pages/admin/AdminDashboard.tsx` only. No layout or card-order changes.

## What changes

1. **Funds in escrow** — sum only money actually received (paid deposit and/or paid balance) on bookings still held, instead of the full agreed price.
2. **Pending vendors** — use the exact same filter as the verification queue page so the card number matches the list it links to.
3. **Growth metrics** — remove the "New organisers" card entirely (it would duplicate the "Joined this month" line on the Total organisers card and would be the only growth card ignoring the period selector). Pull "Quotes awaiting client" and a new "Requests awaiting vendor" from the activation stats function, so they reflect current state rather than a period slice.
4. **Growth cards** — the row ends up with five cards: New ceremonies, Requests sent, Bookings confirmed, Quotes awaiting client, Requests awaiting vendor. The last two show no period-over-period arrows. Remove the now-unused organiser and pending-quote previous-period state and fetches.

5. **Stalled conversations** — keep the feature but raise the threshold from 2 to 24 hours and retitle the section "Vendor chats unanswered over 24h".

Untouched: all other queries, the platform fee calculation, and the revenue cards.

## Technical notes

- Add `const { data: activationStats } = await (supabase as any).rpc('get_admin_activation_stats');` next to the existing registration RPC call, unwrapping the first row.
- New state `requestsAwaitingVendor`; delete `newOrganisers`, `prevOrganisers` and `prevPendingQuotes` state, their fetch/`fetchPrevCount` calls, and the "New organisers" entry in `growthCards`.

- Escrow query selects `deposit_amount, deposit_status, balance_amount, balance_status` filtered on `funds_held_since` not null and `funds_released_at` null.
