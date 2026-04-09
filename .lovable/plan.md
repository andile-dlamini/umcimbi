

## Plan: Remove `create-ozow-payment` JWT bypass from config.toml

### What
Remove the `[functions.create-ozow-payment]` block (with `verify_jwt = false`) from `supabase/config.toml`. The `[functions.ozow-webhook]` block remains unchanged.

### Change
**File: `supabase/config.toml`**
- Delete lines:
  ```
  [functions.create-ozow-payment]
  verify_jwt = false
  ```
- No other changes.

