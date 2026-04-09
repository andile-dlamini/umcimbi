

## Plan: Replace Yoco with Ozow Payment Integration

### Summary
Remove all Yoco payment edge functions and references, create two new Ozow edge functions, add three payment result pages, update the frontend payment trigger, update admin settings, and add a database column.

### Database Migration
Add `ozow_transaction_id` column to bookings table:
```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ozow_transaction_id TEXT;
```

### Edge Functions

**1. Delete these Yoco edge functions:**
- `supabase/functions/create-yoco-checkout/index.ts`
- `supabase/functions/yoco-webhook/index.ts`
- `supabase/functions/register-yoco-webhook/index.ts`

Remove their config entries from `supabase/config.toml`.

**2. Create `supabase/functions/create-ozow-payment/index.ts`**
- POST with `{ booking_id, payment_type }` 
- Auth check via JWT
- Query bookings table for deposit_amount or balance_amount
- Build TransactionReference: `UMCIMBI-{DEPOSIT|BALANCE}-{booking_id}`
- Build BankReference: `UMCIMBI-{booking_id.slice(0,8).toUpperCase()}`
- SHA512 HashCheck using Web Crypto API per Ozow spec (concatenate fields + private key, lowercase, sha512)
- POST to `https://api.ozow.com/PostPaymentRequest` with ApiKey header
- Return `{ paymentUrl }` or `{ error }`

**3. Create `supabase/functions/ozow-webhook/index.ts`**
- No JWT verification (config.toml entry)
- Accept POST from Ozow (form-encoded or JSON)
- Verify hash: rebuild from all fields except Hash, append private key, lowercase, SHA512, compare
- On Status "Complete": update bookings (deposit → set deposit fields; balance → set balance + funds_held_since)
- On other statuses: log only
- Always return 200

**4. Add to `supabase/config.toml`:**
```toml
[functions.create-ozow-payment]
verify_jwt = false

[functions.ozow-webhook]
verify_jwt = false
```

### Frontend Changes

**5. `src/pages/bookings/BookingDetail.tsx`**
- Rename `handleYocoPayment` → `handleOzowPayment`
- Change function invoke from `create-yoco-checkout` to `create-ozow-payment`
- Update body: `{ booking_id: bookingId, payment_type: kind }` (map 'full' → handle as deposit if applicable)
- Use `data.paymentUrl` instead of `data.redirectUrl`
- Remove the Yoco redirect useEffect (payment results now go to dedicated pages)
- Remove `isPayingFull` state and "Pay in Full" button (Ozow spec only supports deposit/balance individually)
- Update all `onClick` references

**6. `src/pages/admin/AdminSettings.tsx`**
- Remove the Yoco webhook registration card entirely
- Keep the "Coming Soon" card

**7. Create three new pages:**
- `src/pages/payment/PaymentSuccess.tsx` — success message, reads `?TransactionReference=`, auto-navigates to `/bookings` after 3s
- `src/pages/payment/PaymentError.tsx` — error message, "Try Again" → `/bookings`, "Contact Support" → mailto:andile@umcimbi.co.za
- `src/pages/payment/PaymentCancel.tsx` — cancel message, "Back to Bookings" → `/bookings`

**8. `src/App.tsx`**
- Import and add routes for `/payment/success`, `/payment/error`, `/payment/cancel` (inside authenticated routes)

### Files Changed
- `supabase/config.toml` — remove 3 Yoco entries, add 2 Ozow entries
- `supabase/functions/create-ozow-payment/index.ts` — new
- `supabase/functions/ozow-webhook/index.ts` — new
- `supabase/functions/create-yoco-checkout/index.ts` — deleted
- `supabase/functions/yoco-webhook/index.ts` — deleted
- `supabase/functions/register-yoco-webhook/index.ts` — deleted
- `src/pages/bookings/BookingDetail.tsx` — updated payment logic
- `src/pages/admin/AdminSettings.tsx` — remove webhook card
- `src/pages/payment/PaymentSuccess.tsx` — new
- `src/pages/payment/PaymentError.tsx` — new
- `src/pages/payment/PaymentCancel.tsx` — new
- `src/App.tsx` — add 3 routes
- New database migration for `ozow_transaction_id`

### Not Changed
- Booking status flow, escrow logic, funds_held_since
- TermsOfService.tsx
- Vendor dashboard logic
- Review trigger logic
- Chat system messages in webhook follow same pattern as existing Yoco webhook
- EftPaymentDialog (unrelated to Yoco/Ozow)

