# Fix quote PDF viewing by moving authentication into the function

## What we will do

1. Add an explicit `get-final-offer-url` entry in `supabase/config.toml` with `verify_jwt = false`, matching the pattern already used by other functions that authenticate internally (e.g. `release-escrow`, `send-quote`, `trigger-vendor-payout`).

2. Leave the function's own authentication and authorization logic untouched: it will still require a valid `Authorization` header, validate the token via `getClaims`, and return 403 unless the caller is the requesting client, the owning vendor, or an admin.

3. Review all other edge functions that read the `Authorization` header and perform their own authentication. Report any that are missing an explicit `verify_jwt` entry in `config.toml` without changing them in this pass, so they can be assessed individually.

4. Verify the fix by testing that:
   - The admin can open a quote PDF.
   - The organiser who owns the request can open the quote PDF.
   - The vendor who sent the quote can open the quote PDF.
   - A logged-in user who is none of those three still gets 403.
   - A request with no `Authorization` header still gets 401.

## Out of scope

- No changes to `src/lib/quoteActions.ts` or any calling page.
- No changes to the `quote-pdfs` storage bucket or its policies.
- No changes to quote generation, booking, payment, payout or Ozow code.
- No changes to RLS policies, database functions, views or migrations.
- No changes to notification or SMS code.
- No changes to other edge functions' `verify_jwt` values in this pass; we will only report them.

## Functions found to authenticate internally but currently missing from `config.toml`

These will be reported for individual assessment, not changed now:

- `accept-quote`
- `decline-quote`
- `generate-final-offer`
- `get-order-pdf-url`
- `raise-dispute`
- `create-ozow-payment`
- `bulk-vendor-import`
- `confirm-delivery`
- `send-quote`
- `send-feedback`
- `upload-delivery-proof`
- `check-sms-balance` (accepts service-role token or admin user)

`auth-email-hook` reads an `Authorization` header only for the LOVABLE_API_KEY preview path and is otherwise a webhook that verifies signatures, so it does not fit the same pattern and will not be reported as a missing internal-auth entry.
