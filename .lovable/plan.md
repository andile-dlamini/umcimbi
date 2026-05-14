## Two scoped changes

### 1. `supabase/functions/trigger-vendor-payout/index.ts`
Loosen the balance payout eligibility check to also allow disputed bookings.

Replace:
```ts
if (booking.booking_status !== "completed" || !booking.funds_released_at) {
  return jsonResponse({ error: "Booking is not eligible for payout" }, 400);
}
```
With:
```ts
if (!["completed", "disputed"].includes(booking.booking_status)) {
  return jsonResponse({ error: "Booking is not eligible for payout" }, 400);
}
```

### 2. `src/pages/admin/AdminOperations.tsx`
Reorder the Confirm Resolution handler so the booking update happens before the payout invocation:

1. `supabase.from('bookings').update({ booking_status: 'completed', funds_released_at: new Date().toISOString() }).eq('id', d.id)`
2. `supabase.functions.invoke('trigger-vendor-payout', { body: { booking_id: d.id, payout_type: 'balance', override_amount: calculated } })`
3. `toast.success(...)` and remove the booking from the disputes list.

Error handling stays the same (toast.error on failure, keep row).

Nothing else changes.