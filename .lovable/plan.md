## Goal

Bring the Ozow Payouts integration into spec compliance by fixing six concrete issues across the trigger and verification edge functions. No other files will be touched.

## Files to modify

1. `supabase/functions/trigger-vendor-payout/index.ts`
2. `supabase/functions/ozow-payout-verification/index.ts`

## Authentication on outbound Ozow calls

Outbound Ozow requests (both `GET /getavailablebanks` and `POST` payout) authenticate **only** with `SiteCode` and `ApiKey` headers. Do NOT send `Authorization: Bearer` on either call. Remove all references to `payoutAccessToken` from outbound Ozow request headers and debug logs. (`OZOW_PAYOUT_ACCESS_TOKEN` is still used inside `ozow-payout-verification` to verify inbound webhooks from Ozow — that stays.)

## Changes — `trigger-vendor-payout/index.ts`

### Fix 1: `getavailablebanks` request headers
Send only:
```ts
{
  "ApiKey": ozowPayoutApiKey,
  "SiteCode": ozowSiteCode,
  "Accept": "application/json",
  "Content-Type": "application/x-www-form-urlencoded",
}
```
No `Authorization` header.

### Fix 2: Account number encryption (AES-256-CBC, Ozow spec)
Replace the current encryption block with:
- `rawKey`: 20-char alphanumeric from `crypto.randomUUID()` (dashes stripped, sliced to 20).
- `encryptionKey`: `rawKey` repeated and sliced to exactly 32 chars → UTF-8 encoded as the 32-byte AES key.
- `iv`: SHA-512 of `${merchantReference}${amountInCents}${rawKey}` lowercased; take the **first 16 characters of the hex string**, then UTF-8 encode those 16 chars to get the 16-byte IV.
- Encrypt `vendor.bank_account_number` with AES-CBC.
- Output `encryptedAccountNumber` as **Base64**.
- Persist `rawKey` (not the padded 32-char key) into `vendor_payouts.encryption_key` — that is what the verification webhook returns to Ozow.

### Fix 3: Reference fields (≤20 chars)
- `customerBankReference = \`UMC-${booking.id.substring(0, 14)}\`.substring(0, 20)`
- `merchantReference = booking.order_number ?? booking.id.substring(0, 20)` (capped at 20).
- `internalReference` (DB-only) stays as-is for our tracking.

### Fix 4: Nested `bankingDetails` payload + auth headers
Outbound POST headers: only `Content-Type: application/json`, `SiteCode`, `ApiKey`. No bearer token.

Body:
```ts
{
  SiteCode, Amount, MerchantReference, CustomerBankReference,
  IsRtc: false, NotifyUrl,
  bankingDetails: { bankGroupId, accountNumber: encryptedAccountNumber, branchCode: universalBranchCode },
  HashCheck,
}
```
HashCheck input order stays flat per Ozow spec: `siteCode + amountInCents + merchantReference + customerBankReference + isRtc + notifyUrl + bankGroupId + encryptedAccountNumber + universalBranchCode + apiKey`, lowercased, SHA-512 hex.

Also strip the `[OZOW DEBUG] PayoutAccessToken` log line.

## Changes — `ozow-payout-verification/index.ts`

### Fix 5: Return `AccountNumberDecryptionKey`
After locating the matching `vendor_payouts` row, also select `encryption_key`. On a successful authorized verification, respond with:
```json
{
  "PayoutId": "<payoutId>",
  "IsVerified": true,
  "AccountNumberDecryptionKey": "<vendor_payouts.encryption_key>",
  "Reason": ""
}
```
Unauthorized / not-found cases respond with `IsVerified: false` and a `Reason`.

### Fix 6: Hash verification with `PayoutId` first
```
[ payoutId, siteCode, amountInCents, merchantReference, customerBankReference,
  isRtc, notifyUrl, bankGroupId, accountNumber, branchCode, apiKey ]
  .join("").toLowerCase() → SHA-512 hex
```
Compare to inbound `HashCheck`; only mark `IsVerified: true` when both bearer token AND hash match.

## Files NOT touched

- `supabase/functions/ozow-payout-notification/index.ts`
- All other project files

## After deploy

Re-run `test-trigger-payout` and inspect `trigger-vendor-payout` logs for the new outbound shape and Ozow's response.
