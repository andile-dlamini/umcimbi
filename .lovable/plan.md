# Prevent duplicate vendor payouts

Close the race that sent two identical R3,250 deposit instructions to Ozow for UMC-O-2026-000038, and make duplicates loud instead of silent.

## Blocker to settle first: the existing duplicate row

Booking `03def34d…` currently has two `deposit` rows in `vendor_payouts`, both `submitted`. The new partial unique index cannot be created while both exist. Nothing here touches Ozow — the cancellation stays manual with their support — but one of the two rows has to leave the `('pending','submitted','paid')` set for the index to build.

Recommended: keep the first row untouched, and mark the second (Aug 23 06:01:50, `20260823-db36-…`) as `failed` with `failure_reason` set to a plain note that it was a duplicate submission being reversed manually with Ozow. This is a bookkeeping correction only. If you'd rather wait for Ozow's confirmation before altering that row, the index creation waits with it.

## Change 1 — Database constraint

New migration:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS uniq_vendor_payout_active
ON public.vendor_payouts (booking_id, payout_type)
WHERE status IN ('pending', 'submitted', 'paid');
```

Failed and rejected payouts stay retryable, as intended today.

## Change 2 — Graceful 409 in trigger-vendor-payout

In `supabase/functions/trigger-vendor-payout/index.ts`, the insert around line 307 gains a unique-violation branch: when the error code is `23505`, return 409 with

```json
{ "error": "Payout already exists for this booking", "status": "duplicate_blocked" }
```

instead of the generic 500. All other insert errors keep the existing 500.

Ordering is already correct — the insert at line 307 precedes the Ozow POST at line 336, so a blocked duplicate returns before any outbound request. No reordering needed; confirmed by reading the file.

The existing read-based guard (line 163) stays as a cheap early exit. The index is the real protection.

Untouched: the amount calculation and the 1.08 divisor, and the response-status mapping in `normalizeInitialStatus`.

## Change 3 — Stop silent failures in release-escrow

In `supabase/functions/release-escrow/index.ts`, the `fetch` to `trigger-vendor-payout` (line 74) currently discards its response. Capture the response, read the body text, and `console.error` booking id, HTTP status, and body when `!res.ok`. Control flow unchanged — no throw, no early return.

## Change 4 — Admin double-click guard

`handleConfirmResolution` in `src/pages/admin/AdminOperations.tsx` already sets `submitting` before the await and both buttons are disabled by it, but a double-click inside the same React tick can still slip through before the re-render. Add a synchronous `useRef` in-flight guard that returns early when a submission is already running, cleared in the same `finally` as `submitting`. Disabled states stay as they are.

## Technical notes

- Migration is index-only; no table, grant, or policy changes.
- Both edge functions get redeployed after editing.
- No cancel or reversal call to Ozow is added anywhere.
