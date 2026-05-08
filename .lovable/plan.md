## Changes to `supabase/functions/trigger-vendor-payout/index.ts`

Two narrowly scoped edits, nothing else touched.

### 1. Add diagnostic log at start of try block

Insert immediately after the auth variables are set (after line 99, before the auth check on line 101):

```ts
console.log("[PAYOUT] Invoked. Auth header length:", authHeader.length, "Service key length:", serviceKey.length, "Match:", authHeader === `Bearer ${serviceKey}`);
```

### 2. Include `deposit_amount` in the booking select

Update the select on line 121 from:

```ts
.select("id, vendor_id, agreed_price, balance_amount, deposit_status, booking_status, funds_released_at, order_number")
```

to:

```ts
.select("id, vendor_id, agreed_price, deposit_amount, balance_amount, deposit_status, booking_status, funds_released_at, order_number")
```

### 3. Fix amount calculation for deposit payouts

Replace lines 158–160:

```ts
const amount = override_amount !== null
  ? override_amount
  : Math.round((Number(booking.balance_amount) / 1.08) * 100) / 100;
```

with:

```ts
const amount = override_amount !== null
  ? override_amount
  : payout_type === "deposit"
    ? Math.round((Number(booking.deposit_amount) / 1.08) * 100) / 100
    : Math.round((Number(booking.balance_amount) / 1.08) * 100) / 100;
```

No other code, logic, or files are modified.
