## Plan

Lower the auth-header length guard in `supabase/functions/trigger-vendor-payout/index.ts` so it accepts the new short-format `SUPABASE_SERVICE_ROLE_KEY` (`sb_secret_...`, length 41) used by `ozow-webhook` and other internal callers.

### Change

`supabase/functions/trigger-vendor-payout/index.ts`, line 101:

```ts
// before
if (!authHeader.startsWith("Bearer ") || authHeader.length < 50) return jsonResponse({ error: "Unauthorized" }, 401);

// after
if (!authHeader.startsWith("Bearer ") || authHeader.length < 20) return jsonResponse({ error: "Unauthorized" }, 401);
```

No other changes.