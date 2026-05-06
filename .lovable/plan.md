## Plan

Three small, surgical edits — no logic changes beyond what's specified.

### 1. `supabase/functions/ozow-payout-notification/index.ts`
In `extractRefs`, replace the single `status:` line with the new IIFE that unwraps the nested `PayoutStatus` object and maps Ozow numeric status codes:
- `5` → `paid`
- `99` → `rejected`
- `4` → `failed`
- `1`/`2`/`3` → `submitted`
- otherwise → `pending`
- Falls back to top-level `Status`/`status` string if `PayoutStatus` isn't an object.

### 2. Remove debug `console.log` lines (keep `console.error`)

**`supabase/functions/trigger-vendor-payout/index.ts`** — delete 7 lines:
- L154 `[BANKS DEBUG] GET ...`
- L294–298 `[OZOW DEBUG] POST/header/SiteCode/ApiKey/body`
- L307 `[OZOW DEBUG] response status ...`

**`supabase/functions/create-ozow-payment/index.ts`** — delete 4 log statements:
- L113 `console.log("DIAG: secrets check", { ... })` (multi-line block)
- L186 `console.log("Ozow payload (no key):", ...)` (multi-line block)
- L190 `console.log("Private key length:", ...)`
- L191 `console.log("Site code:", ...)`

**`supabase/functions/ozow-payout-verification/index.ts`** — delete the `console.log("[VERIFY] Incoming request:", ...)` line.

### 3. `src/pages/Learn.tsx`
Remove the two `'funeral'` entries:
- L15: `'funeral': Flower2,` from the icon map
- L28: `'funeral': 'bg-accent/20 text-accent',` from the colour map

`learnArticles.ts` is left untouched.

### Deploy
After edits, the three modified edge functions auto-deploy.
