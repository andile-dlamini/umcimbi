## Goal

Let planners pay the balance any time after the deposit clears (instead of waiting for the 5-day reminder window), surface the new payment stage in the chat list chip, and backfill the test booking that was manually patched earlier so it reflects a normal post-deposit state.

## Changes

### 1. `src/pages/bookings/BookingDetail.tsx` (line 186)
Replace:
```ts
const balanceDue = booking.balance_status === 'due';
```
with:
```ts
const balanceDue =
  booking.balance_status === 'due' ||
  (booking.deposit_status === 'paid' && booking.balance_status !== 'paid');
```
No other logic touched. The existing render guard (`isClient && balanceDue && booking.balance_status !== 'paid'`) keeps the Pay Balance button hidden post-payment.

### 2. `src/components/chat/ChatDetailsDrawer.tsx` (line 123)
Replace:
```ts
const balanceDue = booking && booking.balance_status === 'due';
```
with:
```ts
const balanceDue =
  booking &&
  (booking.balance_status === 'due' ||
    (booking.deposit_status === 'paid' && booking.balance_status !== 'paid'));
```

### 3. `src/components/chat/ConversationStatusChip.tsx`
Extend the chip to derive its label from both `bookingStatus` and a new optional `balanceStatus` prop:

- `pending_deposit` → "Deposit Due" (amber) — unchanged
- `confirmed` + `balanceStatus !== 'paid'` → "Balance Due" (amber)
- `confirmed` + `balanceStatus === 'paid'` → "All Settled" (emerald)
- `completed` → "Completed" (emerald) — unchanged
- `disputed` → "Disputed" (red) — unchanged
- `cancelled` → "Cancelled" (gray) — unchanged

Then update the two callers in `src/pages/chat/ChatsList.tsx` (lines 155 and 234) to pass `balanceStatus={(conv as any).balance_status}`, and extend `src/hooks/useChat.ts` (the latest-booking query around line 91) to also select `balance_status` and propagate it on the enriched conversation object alongside `booking_status`.

### 4. `supabase/functions/ozow-webhook/index.ts`
Confirmed already correct — on deposit payment it sets `balance_status = 'due'` immediately (line 99) while still computing `balance_due_at` as ceremony − 5 days for the reminder (lines 107–113). No edit needed.

### 5. Patch test booking `UMC-O-2026-000016`
Service-role update setting only:
- `balance_status = 'due'`
- `deposit_paid_at = '2026-05-07T12:34:08.000Z'`
- `balance_due_at = '2026-05-18T14:00:00.000Z'`

All other fields (including `deposit_status`, `booking_status`, `funds_held_since` from the prior patch) stay as-is.

## Out of scope
- No changes to escrow timers, fee math, or PDF generation.
- No schema changes.
