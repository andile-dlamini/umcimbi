
# SMS notification system

Transactional + digested SMS via Connect Mobile, with a 60-day/3-strike dormancy cutoff on vendor sends. Dormancy resets from the client on session refresh (no `auth.users` trigger).

## Tier 1 — immediate SMS
- New service request → vendor
- First chat message → recipient (vendor or planner)
- Quote sent → planner
- Quote accepted → vendor
- Deposit paid → vendor + planner
- Balance paid → vendor
- Delivery proof uploaded → planner
- **Payout released → vendor — fires only when `ozow-payout-notification` resolves `normalizedStatus === 'paid'`. No SMS on `submitted`, `pending`, `failed`, or `rejected`, and none from `trigger-vendor-payout` (its "initial" status never represents settled money).**
- Dispute raised → both
- Vendor 4-hour response nudge → vendor (hourly cron)

## Tier 2 — 30-min digest (count-based)
Unread chat messages (excluding first), quote declined/expired, new review.

Excluded everywhere: `vendors.is_demo = true`, and users with `notification_preferences.sms_enabled = false`.

## payout_released — exact trigger point

Inside `supabase/functions/ozow-payout-notification/index.ts`, right after the successful `vendor_payouts` update:

```ts
if (updateError) return jsonResponse({ error: "Failed to update payout" }, 500);

if (normalizedStatus === "paid") {
  // fire-and-forget; failures never block the webhook ack
  supabase.functions.invoke("notify-vendor-event", {
    body: {
      event_type: "payout_released",
      vendor_payout_id: payout.id,
    },
  }).catch((e) => console.warn("notify-vendor-event failed:", e));
}
```

Idempotency: `sms_notification_log` has a unique index on `(user_id, event_type, related_id)`, with `related_id = vendor_payouts.id`, so a retried "paid" webhook is a no-op. `trigger-vendor-payout` and manual admin status flips do NOT send this SMS.

## Dormancy cutoff

Applies to every vendor-facing send (`vendor-response-nudge` + vendor branches of `notify-vendor-event`, including `payout_released`). Planner sends and digests unaffected.

Before Connect Mobile call: read `auth.users.last_sign_in_at` via `public.get_vendor_last_sign_in(vendor_id)` (SECURITY DEFINER). If `last_sign_in_at < now() - interval '60 days'` AND `vendors.dormant_nudge_count >= 3` → skip, insert `event_type = '<original>__suppressed_dormant'` in `sms_notification_log`, no HTTP call. On successful vendor send: increment `dormant_nudge_count`, set `last_nudge_sent_at`, `last_notified_at`.

**Reset — client-side fallback.** In `src/context/AuthContext.tsx` `onAuthStateChange`, on `SIGNED_IN` and `TOKEN_REFRESHED`, fire-and-forget `supabase.rpc('reset_own_vendor_dormancy')`. RPC is SECURITY DEFINER, scoped to `auth.uid()`, EXECUTE to `authenticated`; sets `dormant_nudge_count = 0, last_nudge_sent_at = NULL`.

## SMS copy (`supabase/functions/_shared/smsTemplates.ts`)

`{name}` = first name or "there"; `{count}` = digest count. Full copy per user's message, including:

- `payout_released` (vendor): *"Hi {name}, your payment has been released to your account. Please log into your UMCIMBI app for more details."*
- Digest: *"Hi {name}, you have {count} new update(s) on UMCIMBI. Please log into your UMCIMBI app for more details."*

(All other templates already agreed above.)

## Database (one migration)

1. `sms_notification_log` — `user_id`, `user_type`, `event_type`, `tier`, `related_id`, `sent_at`; unique index on `(user_id, event_type, related_id)`; admin-only read; GRANT to `service_role`.
2. `notification_preferences` — `sms_enabled bool default true`; users read/write own row.
3. `vendors`: add `dormant_nudge_count int not null default 0`, `last_nudge_sent_at timestamptz`, `last_notified_at timestamptz`.
4. `profiles`: add `last_notified_at timestamptz` (digest watermark).
5. `public.get_vendor_last_sign_in(uuid)` SECURITY DEFINER; EXECUTE to `service_role`.
6. `public.reset_own_vendor_dormancy()` SECURITY DEFINER; EXECUTE to `authenticated`.
7. Trigger on `service_requests` insert → `net.http_post` to `notify-vendor-event`.
8. Trigger on `messages` insert (first non-system message in a conversation) → `net.http_post` to `notify-first-message`.
9. Cron: `vendor-response-nudge` hourly; `notification-digest` every 30 min.

All `net.http_post` calls use service-role bearer from `vault.decrypted_secrets` (mirrors `email_queue_wake`).

## Edge functions (all new)

Common flow: verify service-role bearer → resolve recipient + template → apply exclusions (demo, opt-out, dormancy for vendor sends) → insert into `sms_notification_log` (idempotent) → send via Connect Mobile GET (SA E.164, no `+`) → on vendor success bump counters.

- `notify-vendor-event` — router keyed by `event_type`; for `payout_released` uses `vendor_payout_id` → resolves `vendor_id` → owner phone.
- `notify-first-message`.
- `vendor-response-nudge` — hourly cron, 4h no reply.
- `notification-digest` — 30-min cron.

## Call sites (fire-and-forget `notify-vendor-event`)

- `send-quote` → `quote_sent`
- `accept-quote` → `quote_accepted`
- `ozow-webhook` (deposit success) → `deposit_paid_vendor` + `deposit_confirmed_planner`
- `ozow-webhook` (balance success) → `balance_paid_vendor`
- `upload-delivery-proof` → `delivery_uploaded`
- **`ozow-payout-notification` → `payout_released` ONLY when `normalizedStatus === 'paid'` and the `vendor_payouts` update succeeded** (guard shown above). No invoke on any other normalized value, and none from `trigger-vendor-payout`.
- `raise-dispute` → `dispute_raised_vendor` + `dispute_raised_planner`

## Frontend

- **Settings → Notifications** section: single SMS toggle bound to `notification_preferences.sms_enabled`.
- **`AuthContext`**: `onAuthStateChange` → on `SIGNED_IN` / `TOKEN_REFRESHED`, fire `reset_own_vendor_dormancy` RPC (fire-and-forget, errors swallowed).

## Out of scope

Email fan-out of these events, in-app notification centre / push, quiet hours, admin-driven manual `vendor_payouts` status changes.

Approve and I'll ship the migration, four edge functions, call-site invokes (with `payout_released` strictly gated to `normalizedStatus === 'paid'` inside `ozow-payout-notification`), Settings toggle, and `AuthContext` reset hook.
