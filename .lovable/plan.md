

## Update create-ozow-payment to use OZOW_API_URL secret

### Changes

1. **Add OZOW_API_URL secret** with value `https://api.ozow.com/PostPaymentRequest` (production) or Ozow staging equivalent.

2. **Update `supabase/functions/create-ozow-payment/index.ts`**:
   - Line 103-111: Add `const OZOW_API_URL = (Deno.env.get("OZOW_API_URL") ?? "https://api.ozow.com/PostPaymentRequest").trim();` as first Ozow config line
   - Line 192: Replace hardcoded `"https://api.ozow.com/PostPaymentRequest"` with `OZOW_API_URL`

3. **Update `supabase/config.toml`**:
   - Add `[functions.create-ozow-payment]` section with `verify_jwt = false` (already exists, just confirming) and document that it requires `OZOW_API_URL` secret

### Files to modify

```
supabase/functions/create-ozow-payment/index.ts
supabase/config.toml
```

### Secret to add

```
OZOW_API_URL = "https://api.ozow.com/PostPaymentRequest"
```

