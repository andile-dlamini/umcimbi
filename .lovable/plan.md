
## Public Feedback Surveys

Three public, no-auth survey pages for post-launch user research, backed by a new `survey_responses` table.

### 1. Database migration

Create `public.survey_responses`:

- Columns: `id`, `created_at`, `survey_type` (text, CHECK in `planner_no_event` | `planner_no_vendor` | `vendor`), `responses` (jsonb default `{}`), `whatsapp_number` (text), `willing_to_call` (boolean default false).
- GRANT `INSERT` to `anon` and `authenticated`; `ALL` to `service_role`.
- Enable RLS; single policy "Anyone can insert survey responses" (INSERT, anon + authenticated, WITH CHECK true). No SELECT policy — responses are write-only from the public surfaces.

### 2. Survey pages

Create three files under `src/pages/feedback/`:

- `FeedbackPlannerNoEvent.tsx` — `survey_type = 'planner_no_event'`
- `FeedbackPlannerNoVendor.tsx` — `survey_type = 'planner_no_vendor'`
- `FeedbackVendor.tsx` — `survey_type = 'vendor'`

Shared layout per page:

- No `AppShell` / nav — rendered in the public Routes block.
- Dark indigo header bar (`#111872`) with "UMCIMBI" wordmark in gold (`#E8A838`), page title, subtitle.
- White question cards (shadcn `Card`) with `RadioGroup`, `Checkbox`, `Textarea`, `Input`, `Label` from existing UI primitives.
- Conditional questions rendered based on prior answers (Q2 in NoEvent; branch A/B in Vendor; WhatsApp field on "Yes" to call question).
- Deep blue submit button (`#0A2A92`) — inline styles for the brand colors to avoid touching the design system.
- Required-field validation client-side before submit.
- On submit: `supabase.from('survey_responses').insert({ survey_type, responses, willing_to_call, whatsapp_number })` where `responses` is a JSON object keyed by question id (e.g. `q1`, `q2`, `q3` arrays for checkboxes, strings for radios/textareas). Only writes the 4 allowed columns — no `user_id`.
- Success: replace page content with full-page thank-you ("Siyabonga! 🙏" + English subtext).
- Failure: `toast.error(...)` via sonner; keep form interactive (do not block).

Each file implements the exact question set, options, ordering, and conditional logic from the spec.

### 3. Routes

In `src/App.tsx`:

- Add 3 imports for the new pages.
- Add 3 `<Route>` entries inside the unauthenticated Routes block (next to `/contact`, `/privacy`, `/terms`):
  - `/feedback/planner-no-event`
  - `/feedback/planner-no-vendor`
  - `/feedback/vendor`
- Also add the same 3 routes inside the authenticated Routes block, rendered without `AppShell` is not possible there — instead, leave only the unauthenticated routes. Logged-in users hitting those paths fall through to `*` → `/`. To make the survey links work for everyone, I'll add the 3 routes **outside** `AppShell` in the authenticated branch as well, by placing them before the `<AppShell>` wrapper.

Concretely: refactor `AppRoutes` so that the 3 feedback routes are matched first (no shell, no auth gate) regardless of login state, then fall through to the existing logged-in / logged-out trees. This keeps the surveys publicly accessible while preserving every other route exactly as-is.

### Notes

- No existing pages, components, edge functions, or other routes are modified beyond adding the 3 imports and routes in `App.tsx`.
- Uses existing shadcn primitives and the existing `supabase` client.
- Toasts use `sonner` (already wired in `App.tsx`).
