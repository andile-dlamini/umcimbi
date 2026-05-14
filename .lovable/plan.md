## 5 focused fixes

### Fix 1 — `supabase/functions/raise-dispute/index.ts`
Replace the "most recent conversation between client+vendor" lookup with one that finds the conversation containing a message referencing `booking.order_number` (so the dispute system message lands in the correct thread):

```ts
const { data: convMessages } = await supabase
  .from("messages")
  .select("conversation_id")
  .ilike("content", `%${booking.order_number}%`)
  .limit(1)
  .maybeSingle();
const conv = convMessages ? { id: convMessages.conversation_id } : null;
```

Also include `order_number` in the booking select (it isn't fetched today). No other logic changes.

### Fix 2 — `supabase/functions/upload-delivery-proof/index.ts`
Before inserting the two system messages, count existing system messages in `conv.id` whose content contains "proof of delivery". If count > 0, skip both inserts (and skip the conversation `last_message_at` bump). Existing message bodies stay identical.

### Fix 3 — `src/pages/chat/ChatThread.tsx` (balance-due clickable)
In the system-message branch (around line 496–533), after the `isProofNotice` block add a parallel block:

```ts
const isBalanceDue = typeof message.content === 'string' && message.content.includes('is due by');
const balanceBookingId = activeBooking?.id;
if (isBalanceDue && balanceBookingId) { ...button wrapper navigating to /bookings/${balanceBookingId}, same styling + ChevronRight as proof notice... }
```

### Fix 4 — `src/components/layout/AppSidebar.tsx` (Orders red dot)
Add new state `ordersAlert` (boolean). In a new `useEffect` gated on `user && !isVendor` (or `activeRole !== 'vendor'`), query:
- `bookings` where `client_id = user.id`, `booking_status = 'confirmed'`, `client_confirmed_at IS NULL` → collect ids.
- If any, query `delivery_proofs` `select('booking_id')` `.in('booking_id', ids)` `.limit(1)`. Set `ordersAlert = (data?.length ?? 0) > 0`.

In `organiserItems`, on the `/bookings` Orders item, when `ordersAlert` is true render a small red dot. Implementation: render a `<span className="absolute top-1 right-2 h-2 w-2 rounded-full bg-destructive" />` inside the nav button when this item is Orders and `ordersAlert` is true (collapsed mode: position top-1 right-1). Reuse the existing `relative` button container. No change to vendor nav.

### Fix 5 — Allow up to 3 proof uploads
**`src/pages/chat/ChatThread.tsx`:**
- Change vendor "upload" panel condition `bookingProofs.length === 0` → `bookingProofs.length < 3`.
- Button label: `` `Upload Proof of Delivery (${bookingProofs.length}/3)` ``.
- Restructure the panel so the "✅ Proof submitted…" green banner shows whenever `bookingProofs.length > 0 && !funds_released_at`, AND the upload button still shows below it while `bookingProofs.length < 3`. (Replace the current mutually-exclusive ternary for these two vendor branches with a combined block that renders banner + button as appropriate.)

**`supabase/functions/upload-delivery-proof/index.ts`:**
- Replace the single insert with: query existing `delivery_proofs` row for this `booking_id`. If one exists, `update({ photos: [...existing.photos, photo_url] }).eq('id', existing.id)`. Otherwise `insert({ booking_id, uploaded_by, photos: [photo_url], notes })`. (Postgres `array_append` is unavailable through PostgREST; doing it client-side in the edge function is equivalent and simpler.)

Nothing else changes.