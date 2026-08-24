# Fix balance payment flow and surface the "Balance paid" stage

## Why

Three paths mark a balance as paid. The Ozow webhook keeps the booking `confirmed`, stamps `funds_held_since`, and derives the balance due date from the ceremony date. The two client paths instead jump straight to `completed` and set the balance due immediately. Since `release-escrow` only acts on `confirmed` bookings and is the only writer of `funds_released_at`, any balance paid through a client path leaves the vendor permanently unpayable, silently.

## Changes

1. **Client balance payment (hook)** — `src/hooks/useBookings.ts` `updatePaymentStatus`: on balance paid, set `booking_status = 'confirmed'` and `funds_held_since = now`, not `completed`. Comment records that only `release-escrow` may write `completed` / `funds_released_at`.

2. **Client balance payment (EFT dialog)** — `src/components/chat/EftPaymentDialog.tsx` auto-confirm else-branch: same fix, pointing back to the hook.

3. **Correct balance due date** — both deposit-paid branches currently set `balance_due_at = now`. Change both to read the booking's `event_date_time` and apply the webhook's rule: ceremony date minus five days, floored to now if that is already past, and now when `event_date_time` is null. No join to `events`. `balance_status = 'due'` unchanged.

4. **New funnel stage** — `src/lib/quoteFunnel.ts`: add `'Balance paid'` to the `FunnelStage` union, to `FUNNEL_STAGES` and to `FUNNEL_STAGE_CLASSES` (violet), all between `Deposit paid` and `Completed`. Add optional `balanceStatus` and `fundsReleasedAt` to `QuoteStageInput` and reorder the booking-level checks so `fundsReleasedAt` (or an explicit `completed` status) means Completed, and a paid balance without release reports Balance paid. Header comment updated to say Completed now means escrow actually released. Both fields optional, so existing callers keep compiling.

5. **Admin quotations funnel** — `src/pages/admin/AdminQuotations.tsx`: select `balance_status` and `funds_released_at` in the bookings query and pass them to `getQuoteStage`. The summary grid goes from 8 to 9 cards, so switch the wrapper and the loading skeleton to `lg:grid-cols-3` with 9 skeletons.

6. **Test** — `src/test/bookingPaymentLogic.test.ts` BOOK-HP-04 now expects `booking_status === 'confirmed'`, `funds_held_since` defined, and explicitly not `'completed'`, with a comment on why.

7. **Backfill migration** — return bookings stranded by the bug (`completed` + balance paid + no `funds_released_at`) to `confirmed` with `funds_held_since = COALESCE(funds_held_since, balance_paid_at, now())`. Bookings that already have `funds_released_at` are untouched.

## Out of scope

No balance reminder cron, no changes to `trigger-vendor-payout`, the 1.08 divisor or `normalizeInitialStatus`, and no unique index on `vendor_payouts`.
