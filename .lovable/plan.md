# Security Fixes — 4 Edge Functions Only

Scope is strictly limited to these 4 edge functions. No DB migrations, no RLS changes, no storage bucket changes, no changes to `trigger-vendor-payout`.

## 1. `supabase/functions/admin-daily-brief/index.ts`
Add at the very top of the `Deno.serve` handler (after the CORS preflight check):
- Read `Authorization` header.
- Compare to `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`.
- If missing or mismatched → return `401 Unauthorized` with CORS headers.

## 2. `supabase/functions/release-escrow/index.ts`
Same pattern as #1:
- Require `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`.
- Reject with `401` otherwise.
- Applied before any business logic / DB calls.

## 3. `supabase/functions/ozow-payout-notification/index.ts`
Different header (Ozow callbacks use a custom header):
- Read `AccessToken` header from the request.
- Compare to `Deno.env.get("OZOW_PAYOUT_ACCESS_TOKEN")`.
- If missing or mismatched → return `401 Unauthorized`.
- Applied before any payout processing logic.

## 4. `supabase/functions/seed-demo-users/index.ts`
Two changes:
- Require `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` at the top of the handler; reject with `401` otherwise.
- Remove the demo password from the JSON response body. Return only a success indicator (e.g. `{ ok: true, seeded: <count> }`). Password will no longer be surfaced to callers.

## Notes / Risks
- Any existing client code calling these functions from the browser (without service role key) will start receiving 401. These 4 functions are all backend/admin/webhook endpoints, so this is the intended outcome.
- `seed-demo-users`: if any tooling/UI was reading the demo password from the response, it will break. The password is already known (stored in demo credentials memory), so callers should use that source instead.
- No DB migration required. No types regeneration required.

## Verification after build
- Deploy the 4 functions.
- Confirm unauthenticated `curl` to each returns `401`.
- Confirm authorized call (with correct header) still returns `200`.
