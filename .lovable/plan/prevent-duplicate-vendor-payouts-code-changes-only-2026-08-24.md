# Prevent duplicate vendor payouts (code changes only)

Close the race that sent two identical R3,250 deposit instructions to Ozow for UMC-O-2026-000038, and make duplicates loud instead of silent.

## Out of scope in this task

No migration and no `vendor_payouts` row changes. The unique index and the record corrections wait on Ozow support confirming cancellation of the two queued payouts, and will come as a separate task.

For the record, when requested the corrections will be: `20260823-db36-4aee-be34-eaa383fb9783` set to `paid` with `paid_at` (this one was actually disbursed), `20260823-f9d2-4758-bfa5-d2f7fbdac6fb` set to `rejected`, and the balance payout `20260824-708c-4665-a347-517c1ea66d37` set to `rejected` — leaving exactly one deposit row in the active set so the partial unique index can build.

## Change 2 — Graceful 409 in trigger-vendor-payout

In `supabase/functions/trigger-vendor-payout/index.ts`, the insert around line 307 gains a unique-violation branch: when the error code is `23505`, return 409 with

```json
{ "error": "Payout already exists for this booking", "status": "duplicate_blocked" }
```

instead of the generic 500. All other insert errors keep the existing 500. This makes the function ready for the index the moment it is created.

Ordering is already correct — the insert at line 307 precedes the Ozow POST at line 336, so a blocked duplicate returns before any outbound request. No reordering needed.

The existing read-based guard (line 163) stays as a cheap early exit.

Untouched: the amount calculation and the 1.08 divisor, and the response-status mapping in `normalizeInitialStatus`.

## Change 3 — Stop silent failures in release-escrow

In `supabase/functions/release-escrow/index.ts`, the `fetch` to `trigger-vendor-payout` (line 74) currently discards its response. Capture the response, read the body text, and `console.error` booking id, HTTP status, and body when `!res.ok`. Control flow unchanged — no throw, no early return.

## Change 4 — Admin double-click guard

`handleConfirmResolution` in `src/pages/admin/AdminOperations.tsx` already sets `submitting` before the await and both buttons are disabled by it, but a double-click inside the same React tick can still slip through before the re-render. Add a synchronous `useRef` in-flight guard that returns early when a submission is already running, cleared in the same `finally` as `submitting`. Disabled states stay as they are.

## Technical notes

- No database changes in this task.
- Both edge functions get redeployed after editing.
- No cancel or reversal call to Ozow is added anywhere.
