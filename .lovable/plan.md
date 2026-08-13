# Part two: lock down direct reads of the vendors table

Two migrations, in order: convert the marketplace view so it no longer depends on the caller's own permissions, then remove the broad read rule that lets every signed-in user read every vendor row — including bank details.

## Pre-build check: what still reads the vendors table directly

Confirmed by searching the app and the backend functions.

Safe (owner-scoped or admin-scoped, unaffected):

- `AuthContext`, `useVendors` owner profile read/create/update/delete, `VendorProfileForm`, `VendorOnboarding`, `AuthPage` vendor signup — all filtered to `owner_user_id = auth.uid()` or run by an admin.
- All admin screens (`VendorVerificationQueue`, `VendorUpload`, `AdminOperations`).
- Every backend function that touches vendors (`send-quote`, `accept-quote`, `raise-dispute`, `trigger-vendor-payout`, `upload-delivery-proof`, `get-final-offer-url`, `get-order-pdf-url`, `generate-final-offer`, the SMS and escrow functions) reads vendors through the service-role client, which bypasses these rules. None of them read vendors as the signed-in user. Nothing here breaks.

Will silently return nothing after migration 2 — these are the ones you asked me to report:

| Where | What it reads | Effect |
|---|---|---|
| `useServiceRequests.ts:22` | `vendor:vendors(*)` joined onto requests | My Requests loses vendor name/photo |
| `useQuotes.ts:21` | `vendor:vendors(...)` joined onto quotes | Quote list loses vendor identity |
| `CompareQuotes.tsx:266` | same join | Compare screen loses vendor identity |
| `useBookings.ts:20` and `:252` | `vendor:vendors(...)` | Booking list and detail lose vendor name and contact |
| `events/tabs/VendorsTab.tsx:52` | `vendor:vendors(*)` | Event vendors tab empties |
| `events/tabs/BookVendorsTab.tsx:39,43` | `vendor:vendors(category)` | Category progress reads blank |
| `useVendors.ts:263` | saved vendors join | Saved vendors list empties |
| `useServiceRequests.ts:68` | `vendors.name` after creating a request | Name goes null in the follow-up step |
| `useEvents.ts:205` | `added_to_events_count` read then increment | Counter stops updating (the update half already fails today) |
| `useVendors.ts:329` `useVendorLocations` | `vendors.location` | Nothing — this hook has no callers |

The four surfaces you listed as must-not-break (browse, vendor detail, distance list, chat) all read `vendors_marketplace` already and are fine. The breakage is in the joined reads above, which the earlier pass did not migrate because embedded joins were out of scope.

**Row visibility does not change.** The broad policy's condition is identical to the view's new WHERE clause, so a deactivated or switched-off-province vendor already returns null through these joins today for anyone who is not the owner or an admin. Verified against the data: 10 vendors are currently hidden by that filter, and no quote, request or booking references any of them. Repointing the joins at the view changes which columns are reachable, not which rows.

**Included in this pass:** repoint the ten joined and point reads from `vendors` to `vendors_marketplace`. The embed relationship through the view is confirmed to resolve. This is wiring only — no logic change.


## Migration 1 — convert the view

Drop and recreate `public.vendors_marketplace` with `security_invoker = off`, same explicit column list as now (the seven bank/registration/VAT/notes fields and `selfie_photo_url` stay excluded), plus a row filter that reproduces exactly today's visibility:

```text
WHERE is_active = true AND is_province_live(state_province)
```

Keep the comment, keep the revoke from anonymous visitors, keep the grant to signed-in users. Same pattern the public directory view already uses. Owners no longer see their own inactive row through this view, which is fine — the owner dashboard reads the table directly and is covered by the owner rule.

## Migration 2 — drop the broad rule

Drop the "Active vendors in live provinces viewable by authenticated users" read rule on `public.vendors`. No replacement. The owner rule and the admin rule remain and are sufficient. Insert, update and delete rules untouched; `get_own_vendor_bank_details` untouched.

After this, a signed-in user who is neither owner nor admin cannot read any row of the vendors table, so bank account number, account holder, branch code, account type, registration number, VAT number and admin approval notes are no longer reachable.

## Out of scope

The public directory view, other tables' rules, selfie verification, escrow, SMS, quote documents, payments and the public landing pages are all untouched.

## Verification

- Both migration files present in `supabase/migrations`.
- As an ordinary signed-in user: rows come back from the marketplace view, zero rows from a direct read of the vendors table, and no bank column is reachable.
- As a vendor owner: own profile still readable and editable, bank details still load through the owner-scoped function.
- As an admin: everything still visible.
- Browse, vendor detail, distance list and chat all still return results; if the join fix is included, quotes, bookings, requests, saved vendors and the event vendor tabs too.
