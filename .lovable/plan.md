## Plan

`trigger-vendor-payout` block already exists at lines 3-4 of `supabase/config.toml`. Append a matching block for `release-escrow` so its internal call to `trigger-vendor-payout` (and any service-role JWT it uses) bypasses the gateway's JWT verification.

### Change

Append to `supabase/config.toml`:

```toml
[functions.release-escrow]
verify_jwt = false
```

No other lines touched.