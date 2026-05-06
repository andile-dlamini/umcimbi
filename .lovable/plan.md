## Plan: Create `test-mock-full` Edge Function

Create a temporary edge function that runs 6 sequential calls against the Ozow staging mock API and returns all responses in a single JSON payload.

### File to create

`supabase/functions/test-mock-full/index.ts`

### Behavior

- Method: `POST` only (plus CORS `OPTIONS`)
- `verify_jwt = false` (default for Lovable-managed functions; no `config.toml` change needed)
- Reads secrets: `OZOW_PAYOUT_API_KEY`, `OZOW_SITE_CODE` (will use `ISI-UMC-001` as the literal `siteCode` in bodies/query per spec)
- Parses request body `{ scenario: "isAccountDecryptionFailed" | "isNotVerifiedResponse" | "isAccountNumberDecryptionKeyMissing" }`
- Validates scenario is one of the three allowed values; otherwise returns 400

### Mock base URL

`https://stagingpayoutsapi.ozow.com/mock/v1`

### Sequence

1. **Step 1** — `GET /gettestconfiguration?siteCode=ISI-UMC-001` with headers `SiteCode`, `ApiKey`
2. **Step 2** — `POST /settestconfiguration` with body:
   ```json
   {
     "siteCode": "ISI-UMC-001",
     "isAccountDecryptionFailed": false,
     "isNotVerifiedResponse": false,
     "isAccountNumberDecryptionKeyMissing": false,
     "[scenario]": true
   }
   ```
   (the chosen scenario flag flipped to true)
3. **Step 3** — same as Step 1, to confirm flag set
4. **Step 4** — `POST /requestpayout` with the exact dummy body from the user's request
5. **Step 5** — `GET /getpayout?payoutId={payoutId}` extracted from Step 4 response (checks `payoutId`, `PayoutId`, and nested `payoutStatus.payoutId`). Header: `SiteCode` only (no `ApiKey`). If no `payoutId` is found, return `{ skipped: true, reason: "no payoutId in step4" }` for step5.
6. **Step 6** — `POST /settestconfiguration` resetting all three flags to false

### Response shape

```json
{
  "scenario": "...",
  "step1": { "status": <int>, "body": <parsed-or-text> },
  "step2": { "status": <int>, "body": ... },
  "step3": { "status": <int>, "body": ... },
  "step4": { "status": <int>, "body": ... },
  "step5": { "status": <int>, "body": ... },
  "step6": { "status": <int>, "body": ... }
}
```

Each step captures `status` and parses the response as JSON when possible, falling back to raw text. Errors per-step are caught and returned as `{ error: "..." }` so one failure doesn't abort the chain.

### Not in scope

- No `config.toml` edits
- No deletion of the function (user will delete manually after 3 invocations)
- No DB changes
