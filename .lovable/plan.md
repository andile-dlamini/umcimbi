

## Plan: Balance Payment Escrow Changes

5 targeted changes across 3 files + 1 migration.

---

### 1. `supabase/functions/yoco-webhook/index.ts`

**Change 1 — Hold balance in escrow** (lines 54-57):
Change `kind === "balance"` block from setting `booking_status = "completed"` to `booking_status = "confirmed"` and add `funds_held_since = now`.

**Change 2 — Replace balance chat message with two escrow messages** (lines 119-139):
- Query vendor name: `supabase.from('vendors').select('name').eq('id', booking.vendor_id).single()`
- When `kind === "balance"`, instead of the single "completed" message, insert two system messages:
  - Client message: "✅ Your balance payment of R[amount] has been received and is securely held by Umcimbi. Funds will be released to [vendor name] after your ceremony. You're all set! 🎉"
  - Vendor message: "💰 Great news! The balance payment of R[amount]..."
- Both with `sender_type: "system"`, `message_type: "system"`, `sender_user_id: null`
- Keep deposit and full payment messages unchanged

**Change 3 — Remove review prompt** (lines 141-153):
Delete the entire `isCompleted` block that sends the review_prompt message.

---

### 2. `src/pages/bookings/BookingDetail.tsx`

**4a** — Add `funds_held` to `paymentStatusCfg` (line 26):
```
funds_held: { label: 'Held by Umcimbi', color: 'text-blue-600 dark:text-blue-400' },
```

**4b** — Add escrow info card after the balance payment section (after line 356), shown when `booking.balance_status === 'paid' && booking.booking_status === 'confirmed'`:
- Blue-themed card with Lock icon and "Funds secured" heading
- Conditional text for client vs vendor

**4c** — `canReview` already includes `booking_status === 'completed'` (line 63) — no change needed, it's already correct.

**Import** — Add `Lock` to the lucide-react import (line 10).

---

### 3. Migration: `add_funds_held_since`

```sql
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS funds_held_since timestamptz;
```

---

### Files

| File | Changes |
|------|---------|
| `supabase/functions/yoco-webhook/index.ts` | Escrow status, two messages, remove review prompt |
| `src/pages/bookings/BookingDetail.tsx` | funds_held status, escrow card, Lock import |
| Migration | Add `funds_held_since` column |

