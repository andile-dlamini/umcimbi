

## Three targeted bug fixes

Apply three small, isolated fixes. No other files, logic, or styles will be touched.

### Fix 1 — True fire-and-forget Order PDF generation
**File:** `supabase/functions/accept-quote/index.ts`

Remove the `await` on the order-confirmation PDF call so quote acceptance returns to the user immediately instead of blocking on PDF generation. Replace the `try/await/catch` block with a non-awaited `fetch(...).catch(...)`.

### Fix 2 — Hide Accept/Decline while vendor revision is pending
**File:** `src/components/chat/QuoteCard.tsx`

- Add a new derived flag right below `isPending`:
  ```ts
  const isAdjustmentPending = currentStatus === 'adjustment_requested';
  ```
- Update the Accept/Decline render block so those buttons only show when `isPending && !isAdjustmentPending`.
- When `isAdjustmentPending` is true, render this in their place:
  ```tsx
  <p className="text-sm text-muted-foreground text-center py-2">Awaiting vendor revision…</p>
  ```
- The Request Adjustment button logic stays exactly as-is.

### Fix 3 — Set balance due date to 5 days before ceremony on Ozow deposit
**File:** `supabase/functions/ozow-webhook/index.ts`

Inside the `Status === "Complete"` branch, when `payment_type === "deposit"`:
- After setting deposit/booking/balance statuses, fetch the booking's `event_date_time`.
- Compute `balance_due_at = ceremonyDate − 5 days`.
- If that date is still in the future, use it; otherwise fall back to `now` (matches existing behaviour for past/imminent ceremonies).
- The `balance` branch is untouched.

This aligns Ozow deposit handling with the platform's "5-day pre-ceremony balance deadline" rule.

### Scope guarantees
- No other files modified.
- No styling, copy, or unrelated logic changes.
- No DB migrations, no config changes, no new dependencies.
- Edge functions `accept-quote` and `ozow-webhook` will be redeployed automatically after the edits.

