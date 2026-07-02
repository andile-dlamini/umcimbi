## 1. Remove AI Insights, Bulk Upload, Waitlist

**`src/components/admin/AdminSidebar.tsx`** — delete the three nav items (AI Insights, Bulk Upload, Waitlist) and their now-unused lucide icon imports (`Sparkles`, `Upload`, `Clock`).

**`src/App.tsx`** — remove imports for `AdminInsights`, `BulkVendorUpload`, `AdminWaitlist`, and the three `<Route>` entries (`insights`, `bulk-vendors`, `waitlist`).

**Delete files:**
- `src/pages/admin/AdminInsights.tsx`
- `src/pages/admin/BulkVendorUpload.tsx`
- `src/pages/admin/AdminWaitlist.tsx`

**Flag (not auto-deleting):** `supabase/functions/send-waitlist-launch-emails/` is only invoked from `AdminWaitlist.tsx`. Leaving it deployed so no live infra is torn down accidentally — flagging so you can decide later. No other page/function depends on it. DB tables (`waitlist_signups`, etc.) untouched.

## 2. Merge vendor approve + business verification

**`src/pages/admin/VendorVerificationQueue.tsx`:**
- Update `handleApprove` to set `is_active: true`, `business_verification_status: 'verified'`, `verification_reviewed_at: now()`, `verification_reviewed_by: user?.id ?? null` in a single update.
- Delete `handleVerifyBusiness` and its "Verify business" button.
- Leave `isVerified` badge, reject flow, and request-info flow untouched.

## 3. Fix funnel "Registered" undercount

**`src/pages/admin/AdminDashboard.tsx`** — in `fetchAll`, replace the `user_roles` count query with:

```ts
setFunnelRegistered(Number(stats?.total_organisers || 0));
```

using the existing `stats` from the `get_admin_user_registration_stats` RPC. No new RLS.

## 4. Add "Search activity" section to Admin Dashboard

**`src/pages/admin/AdminDashboard.tsx`:**

- Add state: `zeroResultSearches` (array) and `topSearchedCategories` (Record<string, number>).
- In `fetchAll`:
  - Fetch latest 20 `platform_events` where `event_type = 'search_zero_results'` (ordered by `created_at` desc) → `setZeroResultSearches`.
  - Fetch all `platform_events` where `event_type IN ('search_performed', 'search_zero_results')`, aggregate `metadata.category` counts client-side → `setTopSearchedCategories`.
- Add a new "Search activity" Card below the ceremony pipeline with:
  - **Searches that found nothing** — table with columns Query (`metadata.query` or "—"), Category (`categoryLabels[metadata.category]` or "Any"), Location (`metadata.location` or "Any"), When (`formatDistanceToNow`). Empty state: "No zero-result searches — good sign."
  - **Most searched categories** — horizontal bar list reusing the same style as "Vendors by Category", sorted descending.

**Limitation flagged:** This section does not show who searched (no planner name/contact). Surfacing that would require joining `platform_events.actor_id` to `profiles`, which has no admin RLS policy — a separate change if wanted, not included here.

## Explicitly untouched
Other admin pages/routes, Revenue, Vendor Trust, Feedback, Settings, "Awaiting vendor reply", "Ceremony pipeline", AI Daily Brief card, Vendors by Category chart, all RLS policies, all edge functions except the flagged waitlist one.
