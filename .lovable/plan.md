# Plan: Real encryption + HashCheck in `test-mock-full` Step 4

Update `supabase/functions/test-mock-full/index.ts` so the Step 4 `requestpayout` body sends a real encrypted ABSA test account number and a valid HashCheck, mirroring the production logic in `trigger-vendor-payout`.

## Constants (Step 4 only)

- `SiteCode`: `ISI-UMC-001`
- `Amount`: `1.00` → `amountInCents = 100`
- `MerchantReference`: `UMC-M-${Date.now().toString().slice(-8)}` (already used)
- `CustomerBankReference`: `UMC-MOCK-REF-001`
- `IsRtc`: `false`
- `NotifyUrl`: `https://pnnckeqrzjglcwkyzzxg.supabase.co/functions/v1/ozow-payout-notification`
- `BankGroupId`: `3284a0ad-ba78-4838-8c2b-102981286a2b`
- `BranchCode`: `632005`
- Account number to encrypt: `4050338500`
- ApiKey: from `OZOW_PAYOUT_API_KEY` (already loaded as `apiKey`)

## Changes

1. Add a small helper `bytesToHex(bytes: Uint8Array): string` (copy from `trigger-vendor-payout`).
2. Just before building the `payoutBody` for Step 4, compute:
   - `rawKey = crypto.randomUUID().replace(/-/g, "").substring(0, 20)`
   - `encryptionKey` = `rawKey` repeated until length ≥ 32, then sliced to 32 chars
   - `ivInput = (merchantReference + amountInCents + rawKey).toLowerCase()`
   - `ivHex = SHA-512(ivInput)` as hex; `iv = ivHex.substring(0, 16)`
   - Import `encryptionKey` bytes as AES-CBC key
   - Encrypt UTF-8 bytes of `"4050338500"` with `iv` bytes
   - `encryptedAccountNumber = base64(ciphertext)`
3. Compute `HashCheck`:
   - Concatenate `siteCode + amountInCents + merchantReference + customerBankReference + isRtc + notifyUrl + bankGroupId + encryptedAccountNumber + branchCode + apiKey`
   - `.toLowerCase()`, then SHA-512 → hex
4. Replace the Step 4 `payoutBody` so:
   - `bankingDetails.accountNumber = encryptedAccountNumber`
   - `bankingDetails.branchCode = "632005"` (unchanged)
   - `bankingDetails.bankGroupId` unchanged
   - `HashCheck = computed hash`
5. Leave Steps 1, 2, 3, 5, 6, response shape, CORS, and scenario logic untouched.

## Technical notes

- All crypto uses Web Crypto (`crypto.subtle`), identical to `trigger-vendor-payout` so the HashCheck Ozow validates against will match.
- No new secrets, no schema changes, no other functions touched.
- Only `supabase/functions/test-mock-full/index.ts` is modified.
