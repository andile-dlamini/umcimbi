# Plan: In-App Feedback Mechanism

## Recipient
All feedback emails will be sent to **feedback@umcimbi.co.za** (instead of `admin@umcimbi.co.za`). Configurable later via a `FEEDBACK_EMAIL` edge-function env var, defaulting to `feedback@umcimbi.co.za`.

## UX
- A small floating **"Feedback"** button (bottom-right, above the InstallPrompt, hidden on mobile bottom-nav overlap).
- Visible on every authenticated page **except** `/onboarding`, `/auth`, and `/chat/*` (same exclusions as `AppShell`).
- Clicking opens a modal with:
  - **Type** select: Bug / Idea / Praise / Other
  - **Message** textarea (required, 10–2000 chars)
  - Optional **page URL** auto-captured (read-only, shown as small caption)
  - Submit / Cancel
- Toast on success: "Thanks — we got your feedback."

## Backend

### New table: `feedback`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid null | FK auth.users (no cascade) |
| user_email | text null | snapshot for unauthed-context safety |
| user_role | text null | 'planner' \| 'vendor' \| 'admin' |
| feedback_type | text | 'bug' \| 'idea' \| 'praise' \| 'other' |
| message | text not null | |
| page_url | text null | |
| user_agent | text null | |
| status | text default 'new' | 'new' \| 'reviewed' \| 'resolved' |
| created_at | timestamptz default now() | |

**RLS**:
- INSERT: any authenticated user can insert their own row (`auth.uid() = user_id`).
- SELECT: only admins (`has_role(auth.uid(), 'admin')`).
- UPDATE: only admins (to change status).

### New edge function: `send-feedback`
- `verify_jwt = true` (only logged-in users can submit).
- Validates input with Zod (type enum, message length).
- Inserts row into `feedback` table (using the caller's JWT — RLS enforced).
- Enqueues an email to `feedback@umcimbi.co.za` via `enqueue_email` RPC, applying the same fix pattern we just used:
  - `sender_domain: 'mail.umcimbi.co.za'`
  - `from: 'UMCIMBI <noreply@umcimbi.co.za>'`
  - lookup/create `unsubscribe_token` for `feedback@umcimbi.co.za`
  - `idempotency_key: feedback-${row.id}`
  - Logs `pending` row to `email_send_log`.
- Email body: branded indigo-header template (matches daily brief / dispute style) with submitter name/email/role, type badge, message, page URL, and a "View in Admin" link to `/admin/feedback`.

## Admin page: `/admin/feedback`
- New nav item "Feedback" in `AdminSidebar` (icon: `MessageSquare`).
- Lists feedback rows newest-first with: type chip, snippet, submitter, page, date, status.
- Click row → drawer with full message + status dropdown (new/reviewed/resolved).
- Filter by type and status.

## Files to create
- `supabase/functions/send-feedback/index.ts`
- `src/components/feedback/FeedbackButton.tsx` (floating button + modal)
- `src/pages/admin/AdminFeedback.tsx`
- New migration: `feedback` table + RLS

## Files to edit
- `src/components/layout/AppShell.tsx` — mount `<FeedbackButton />` next to `<InstallPrompt />` (with same `hideNav` exclusion).
- `src/components/admin/AdminSidebar.tsx` — add "Feedback" nav item.
- `src/App.tsx` — register `/admin/feedback` route under `AdminGuard`.
- `supabase/config.toml` — no change needed (verify_jwt defaults are fine).

## Out of scope (v1)
- Screenshot attachments
- Email replies / threading
- Public roadmap / upvoting
- Anonymous (unauthed) feedback

Approve and I'll build it.
