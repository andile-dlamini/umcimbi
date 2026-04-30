# Fix ozow-payout-verification hash computation

Apply two targeted fixes to `supabase/functions/ozow-payout-verification/index.ts` so the hash matches what Ozow sends during the verification callback.

## Fix 1 — Extract nested `bankingDetails` fields

After the existing `pick()` calls for `branchCode` and `incomingHash`, add resolution helpers that fall back to fields nested under `payload.bankingDetails`:

```typescript
const bankingDetails = (payload.bankingDetails as Record<string, unknown>) ?? {};
const resolvedBankGroupId = bankGroupId || String(bankingDetails.bankGroupId ?? bankingDetails.BankGroupId ?? "");
const resolvedAccountNumber = accountNumber || String(bankingDetails.accountNumber ?? bankingDetails.AccountNumber ?? "");
const resolvedBranchCode = branchCode || String(bankingDetails.branchCode ?? bankingDetails.BranchCode ?? "");
```

Then in the hash computation (the `[ payoutId, ozowSiteCode, amountInCents, ... ].join("")` array), replace:
- `bankGroupId` → `resolvedBankGroupId`
- `accountNumber` → `resolvedAccountNumber`
- `branchCode` → `resolvedBranchCode`

## Fix 2 — Convert amount to cents for hash

Replace:

```typescript
const amountInCents = pick(payload, ["AmountInCents", "amountInCents", "amount_in_cents", "Amount", "amount"]);
```

With:

```typescript
const rawAmount = pick(payload, ["AmountInCents", "amountInCents", "amount_in_cents", "Amount", "amount"]);
const amountInCents = String(Math.round(parseFloat(rawAmount || "0") * 100));
```

## Deploy & verify

- Redeploy `ozow-payout-verification`.
- No other lines in the file change.
