# Exclude admin-account demo activity from UMCIMBI numbers

## What changes
Any quote request, chat, quotation or booking started by an admin account (you) is treated as demo activity and left out of every platform number. Vendors still see and reply to these requests normally — only the counting changes.

## Where it applies
- Admin dashboard: new requests (and previous-period comparison), bookings/revenue cards, organiser activation counts, stalled unanswered-chat alerts
- Admin activation stats (vendors requested/responded/quoted, requests awaiting vendor, quotes awaiting client, median response time) and ceremony pipeline
- Admin Quotations funnel page
- Morning AI daily brief (requests, quotes, response time, bookings, revenue)

## Technical details
- Rule: a record is "admin demo" when its organiser (`service_requests.requester_user_id`, `conversations.user_id`, `bookings.client_id`, quotes via their request) has the `admin` role in `user_roles`.
- One migration: add `public.is_admin_user(uuid)` security-definer helper; recreate `get_admin_activation_stats`, `get_ceremony_pipeline`, `get_stalled_conversations` with `NOT is_admin_user(...)` filters.
- Frontend: AdminDashboard.tsx and AdminQuotations.tsx fetch admin user ids once and filter them out of the counts.
- Edge function `admin-daily-brief`: filter admin-owned requests/quotes/bookings before computing stats; redeploy.
- Nothing is deleted; vendor-facing screens and vendor KPIs unchanged.
- Record the rule in AGENTS.md.
