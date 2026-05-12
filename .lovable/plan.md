## Three targeted cleanup edits

### 1. `supabase/functions/ozow-webhook/index.ts`
Remove every line containing `[HASH DEBUG]`, `[HASH DEBUG2]`, or `[AMOUNT DEBUG]`. All other `console.log` / `console.error` lines stay intact. (Note: prior cleanup already removed the HASH DEBUG lines — this pass will confirm none remain and remove any AMOUNT DEBUG line if present.)

### 2. `supabase/functions/trigger-vendor-payout/index.ts`
Delete line 101:
```ts
console.log("[PAYOUT] Invoked. Auth header length:", authHeader.length, "Service key length:", serviceKey.length, "Match:", authHeader === `Bearer ${serviceKey}`);
```

### 3. Balance-due derivation fix (treat paid deposit + unpaid balance as "due")

**`src/pages/bookings/BookingDetail.tsx`**
```ts
const balanceDue = booking.balance_status === 'due' ||
  (booking.deposit_status === 'paid' && booking.balance_status !== 'paid');
```

**`src/components/chat/ChatDetailsDrawer.tsx`**
```ts
const balanceDue = booking &&
  (booking.balance_status === 'due' ||
    (booking.deposit_status === 'paid' && booking.balance_status !== 'paid'));
```

No other files, logic, or styling will be touched.