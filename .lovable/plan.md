## Plan

Add a function-specific config block to `supabase/config.toml` so the `trigger-vendor-payout` edge function deploys with `verify_jwt = false`. This bypasses the Supabase Edge gateway's JWT verification (which currently rejects the legacy service-role JWT sent by `ozow-webhook`), allowing the function's own in-code auth check to run.

### Change

Append to `supabase/config.toml`:

```toml
[functions.trigger-vendor-payout]
verify_jwt = false
```

No other lines in the file are touched. After approval and deploy, the next `ozow-webhook` deposit trigger should reach `trigger-vendor-payout` and create a `vendor_payouts` row.