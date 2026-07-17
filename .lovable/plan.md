# Two-stage vendor release for bulk import

Split "release to vendor" (SMS) from "release to public" (visibility). Vendors start inactive; admin releases each stage independently. Login-status is informational, never blocking.

## 1. Edge function — `supabase/functions/bulk-vendor-import/index.ts`

**`create_vendors`**
- Change the vendor insert: `is_active: false` (was `true`). No other logic changes — normalization, dedup, profile/auth creation, `is_registered_business` conditional block all stay.

**`send_registration_sms`** — unchanged (this is "Release to Vendor").

**New action: `release_to_public`**
- Input: `{ action: "release_to_public", vendor_ids: string[] }`.
- Admin-gated via existing `requireAdmin` helper.
- For each id: `admin.from("vendors").update({ is_active: true }).eq("id", id)`. Push `{ vendor_id, status: "released" }` or `{ vendor_id, status: "failed", reason }`. Try/catch per row so one failure never stops the batch.
- Returns `{ results: [...] }`.

**New action: `get_login_status`**
- Input: `{ action: "get_login_status", vendor_ids: string[] }`.
- For each id: `admin.rpc("get_vendor_last_sign_in", { _vendor_id: id })`. Push `{ vendor_id, has_logged_in: <returned value is not null> }`. On RPC error, push `has_logged_in: false` and log — don't fail the batch.
- Returns `{ results: [...] }`. Uses the existing SECURITY DEFINER function; no new SQL.

## 2. Admin UI — `src/pages/admin/VendorBulkImport.tsx`

**State additions** (per created vendor, keyed by `vendor_id`)
- `publicStatus: "idle" | "releasing" | "public" | "failed"` + optional `reason`.
- `loginStatus: { has_logged_in: boolean } | undefined`.
- Existing `smsStatus` and `mediaStatus` stay untouched.

**Results table columns** (after `create_vendors` returns)
1. Vendor (name + phone)
2. Created status (existing badge: Created / Skipped / Failed)
3. Media attached (existing)
4. **Release to Vendor** — existing Send SMS button + Not sent / Sent / Failed badge.
5. **Release to Public** — new button. States: `Not released` (default), `Releasing…`, `Public` (green), `Failed` (red, with reason + Retry). Beside the button, if `loginStatus?.has_logged_in === false`, show a small amber inline badge: "Vendor hasn't logged in yet". Button is NEVER disabled by this — purely informational.

**Login-status fetch**
- Right after `create_vendors` returns, collect all `vendor_id`s with `status === "created"` and call `get_login_status` in one invoke. Populate `loginStatus` map.
- Small "Refresh login status" icon-button (RefreshCw icon) above the table re-runs the same invoke on demand.

**Bulk actions above the table**
- Existing "Release All to Vendor" (sends SMS to every created vendor whose `smsStatus !== "sent"`) — unchanged.
- New "Release All to Public" — sends every created vendor's id (regardless of login status or current `publicStatus`, except those already `public`) in one `release_to_public` invoke; updates each row's `publicStatus` from the returned `results` array.

**Per-vendor operability**
- The four statuses (Created, Media, Vendor SMS, Public) are independent — no ordering enforced, no cross-disabling. Retry on Release to Public re-invokes with just that one id.

**Styling**
- Reuse existing `Badge` variants (green = success, amber = warning/inline notice, red = failed, muted = idle) matching `VendorVerificationQueue.tsx` conventions already in the page. No new shadcn primitives.

## Files touched
- Edit: `supabase/functions/bulk-vendor-import/index.ts` (flip `is_active`, add two actions).
- Edit: `src/pages/admin/VendorBulkImport.tsx` (new column, bulk button, login-status map + refresh).

## Out of scope
Media attachment logic, phone normalization, dedup, `is_registered_business` handling, `send_registration_sms`, RLS, `get_vendor_last_sign_in` function itself — all untouched.
