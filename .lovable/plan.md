
## Plan: Connect Mobile SMS balance monitor

### 1. Edge function `check-sms-balance`
- `supabase/functions/check-sms-balance/index.ts`
- Calls `GET https://api.connect-mobile.co.za/sms/balance/v3/` with `Authorization: Bearer ${CONNECT_MOBILE_API_KEY}`. If 401/403, fall back to `?api_key=` query param. Logs raw response so we can iterate on field shape.
- Parses balance from common JSON shapes (`balance`, `credits`, `data.balance`).
- Computes status: Green >200, Yellow 50–200, Red <50.
- Inserts result into `sms_balance_checks`.
- If `red` AND no red-status row in last 24h, enqueues low-balance email to `admin@umcimbi.co.za` via `send-transactional-email`.
- Manual JWT + admin role check for direct (UI refresh) calls; service-role header bypasses for cron. `verify_jwt = false` in config.toml.

### 2. Database
- New table `sms_balance_checks` (id, balance int, status text, checked_at timestamptz default now, alert_sent bool default false). RLS: admins SELECT; service role full access.
- pg_cron daily 08:00 SAST → `net.http_post` to `check-sms-balance` with service-role auth header.

### 3. Low-balance email
- New transactional template `sms-balance-low.tsx` in `_shared/transactional-email-templates/` (balance, threshold, status, recharge link/contact).
- Register in `registry.ts`.
- Hardcode recipient `admin@umcimbi.co.za` in the edge function's invoke call.

### 4. Admin Overview UI
- New `src/components/admin/SmsBalanceCard.tsx`: title "SMS Credits (Connect Mobile)", balance number, traffic-light dot (green/yellow/red), last-checked timestamp, Refresh button. Loads latest row from `sms_balance_checks`; Refresh invokes the edge function then refetches.
- Mount in `src/pages/admin/AdminDashboard.tsx` as a small card above the funnel section (doesn't disturb existing 4-col revenue grid).

### 5. Files
| File | Action |
|------|--------|
| `supabase/functions/check-sms-balance/index.ts` | Create |
| `supabase/functions/_shared/transactional-email-templates/sms-balance-low.tsx` | Create |
| `supabase/functions/_shared/transactional-email-templates/registry.ts` | Edit |
| `supabase/config.toml` | Edit (add `[functions.check-sms-balance] verify_jwt = false`) |
| `src/components/admin/SmsBalanceCard.tsx` | Create |
| `src/pages/admin/AdminDashboard.tsx` | Edit (mount card) |
| Migration | Create `sms_balance_checks` + RLS + pg_cron |

### Not touched
AdminLayout, AdminSidebar, AdminTopBar, AdminGuard, AdminWaitlist, send-otp, other admin pages or unrelated code.

### Notes
- Reuses existing `CONNECT_MOBILE_API_KEY` and email queue infrastructure.
- Email deduped to once per 24h while status stays Red.
- First run will log the raw API body so we can confirm field names and auth shape.
