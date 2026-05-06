## Changes to `supabase/functions/test-mock-full/index.ts`

**Change 1 — Step 2 setBody (replace the loop-based construction):**

Replace:
```ts
const setBody: Record<string, unknown> = { siteCode: SITE_CODE_LITERAL };
for (const s of SCENARIOS) setBody[s] = (s === scenario);
```

With explicit 7-flag object:
```ts
const setBody = {
  siteCode: SITE_CODE_LITERAL,
  isAccountDecryptionFailed: scenario === "isAccountDecryptionFailed",
  isNullResponse: false,
  isInvalidStatusCode: false,
  isPayoutMismatch: false,
  isNotVerifiedResponse: scenario === "isNotVerifiedResponse",
  isAccountNumberDecryptionKeyMissing: scenario === "isAccountNumberDecryptionKeyMissing",
  hasRetriedCountBeenExceeded: false,
};
```

**Change 2 — 10s wait between Step 4 and Step 5:**

Insert immediately after the Step 4 `doStep` call and before extracting `payoutId`:
```ts
await new Promise(r => setTimeout(r, 10000));
```

Nothing else (Step 6 reset loop, encryption logic, scenarios array, etc.) is touched. Then deploy the function.
