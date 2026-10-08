# Security migration: trust-score lockdown, marketplace view trim, vendors_public revoke

Create ONE new migration in `drizzle/migrations/` containing exactly the SQL from the uploaded file (61 lines), unchanged. No other files edited (types.ts auto-regenerates).

## What it does
1. Records the already-applied drop of the duplicate "Clients can upload own payment proofs" storage policy.
2. Trust score: renames the real function to `calculate_vendor_trust_score_core` (service role only) and adds wrapper `calculate_vendor_trust_score` + rewritten `recalculate_all_trust_scores` that reject signed-in non-admins and anonymous callers; cron/service role still pass. Execute granted to authenticated + service_role only.
3. Rebuilds `vendors_marketplace` without banking, admin, verification-review, nudge and trust-breakdown columns; SELECT for authenticated + service_role only.
4. Revokes all access to `vendors_public` from PUBLIC/anon/authenticated.
5. Reloads the API schema cache.

## Checks done beforehand
- Nothing else depends on `vendors_marketplace`, so DROP VIEW will succeed.
- anon already has no SELECT on `vendors_marketplace` or `vendors_public`, so signed-out browsing is not changed by this.
- No planner/marketplace screen reads the removed columns from the view (bank/payout fields are read from the vendor's own `vendors` row).
- Callers of `calculate_vendor_trust_score`: admin pages (admin passes), `confirm-delivery` and `raise-dispute` edge functions. Those must call with the service role or an admin user; if they use the end-user's token, the organiser/vendor call would now be refused (trust score just wouldn't refresh — the delivery/dispute itself is unaffected if the error is non-fatal). I will check this after applying and report it, without editing the functions.

## After applying
- Confirm the migration path, new grants, and that the admin "Recalculate all scores" still works.
- Report the file path only, plus any edge-function caveat found.
