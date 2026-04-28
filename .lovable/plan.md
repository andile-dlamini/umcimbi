## Fix trigger-vendor-payout for Ozow Payouts API compliance

### 1. Migration: `supabase/migrations/<ts>_vendor_payouts_ozow_fields.sql`
```sql
ALTER TABLE public.vendor_payouts
  ADD COLUMN IF NOT EXISTS encryption_key text,
  ADD COLUMN IF NOT EXISTS bank_group_id text;
```

### 2. Rewrite `supabase/functions/trigger-vendor-payout/index.ts`

- Add secret reads: `OZOW_SITE_CODE`, `OZOW_PAYOUT_API_KEY`, `OZOW_PAYOUT_NOTIFY_URL`. Extend the "not configured" 500 check to require `ozowSiteCode` and `ozowPayoutApiKey`. Keep `OZOW_PAYOUT_ACCESS_TOKEN` (used by webhook functions).
- Extend `SENSITIVE_KEYS` with `"encryptionkey"` and `"encryption_key"`.
- Before insert/payout: GET `${payoutApiUrl}/getavailablebanks` with `SiteCode`/`ApiKey` headers. Match vendor.bank_name to `bankGroupName` (case-insensitive bidirectional substring). On failure → 502; on no match → 400. Capture `bankGroupId`, `universalBranchCode`.
- AES-256-CBC encryption (Web Crypto, PKCS7 default) of vendor.bank_account_number:
  - 32 random bytes → `encryptionKeyHex`
  - IV = first 16 bytes of `SHA-512(merchantReference + amountInCents + encryptionKeyHex)`
  - merchantReference = booking.order_number ?? booking.id; amountInCents = round(amount*100)
  - Output as lowercase hex → `encryptedAccountNumber`
- SHA-512 HashCheck over lowercase concat in this order: `siteCode, amountInCents, merchantReference, internalReference, false, notifyUrl, bankGroupId, encryptedAccountNumber, universalBranchCode, ozowPayoutApiKey`.
- Replace `payoutPayload` with Ozow-spec shape: `SiteCode, MerchantReference, CustomerBankReference (=internalReference), Amount (rand float), IsRtc=false, NotifyUrl, BankGroupId, AccountNumber (encrypted hex), BranchCode (universalBranchCode), HashCheck`. Drop `BankName`, `AccountHolderName`, `AccountType`, `RecipientName`, `CurrencyCode`, `InternalReference`.
- Move `vendor_payouts` insert to AFTER bank lookup + encryption succeed (avoids orphan pending rows). Persist `encryption_key: encryptionKeyHex` and `bank_group_id: bankGroupId`.
- Outbound POST to Ozow: replace `AccessToken`/`x-access-token` headers with `SiteCode` + `ApiKey`.

### 3. New secret to add
- `OZOW_PAYOUT_NOTIFY_URL` = `https://umcimbi.co.za/functions/v1/ozow-payout-notification`

(`OZOW_SITE_CODE`, `OZOW_PAYOUT_API_KEY`, `OZOW_PAYOUT_API_URL`, `OZOW_PAYOUT_ACCESS_TOKEN` already configured.)

### Files NOT touched
`ozow-payout-verification`, `ozow-payout-notification`, all other files.