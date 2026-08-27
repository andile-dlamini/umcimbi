# Add unmet-demand capture form to zero-results vendor browse page

## Goal
When an authenticated organiser searches the vendor directory and gets no results, show a lightweight form so they can tell us what they need and where they need it. The submission is recorded as `feedback_type = 'unmet_demand'` and visible in the admin feedback list.

## Changes

### 1. `src/pages/vendors/VendorsList.tsx`
- Replace the existing `!isLoading && vendors.length === 0` empty state block with a capture form.
- Heading text (exact copy):  
  `Couldn't find what you were looking for. Tell us what you need and where you need it and we will find it for you`
- Two inputs:
  - "What do you need?"
  - "Where do you need it?"
- Submit button label: "Send"
- On submit:
  - Trim both inputs.
  - Validate that input 1 is non-empty; if empty, show a validation message and abort.
  - Compose `message` as:  
    `Needs: <input1> | Where: <input2> | Filters — category: <category or 'all'>, location: <locationFilter or 'none'>, search: <search or 'none'>`
  - Ensure final message length is 10–2000 characters (abort with validation message if not).
  - Call `supabase.functions.invoke('send-feedback', { body: { feedback_type: 'unmet_demand', message, page_url: window.location.origin + location.pathname, user_agent: navigator.userAgent } })`.
  - On success: show success toast and clear both inputs.
  - On failure: show error toast.
- Toast pattern must match `src/components/feedback/FeedbackButton.tsx` (legacy `useToast` hook with `title`/`description`/`variant: 'destructive'`).
- Leave the `trackEvent` useEffect, filters, pagination, "Show more vendors", and all other existing logic untouched.

### 2. `supabase/functions/send-feedback/index.ts`
- Add `'unmet_demand'` to the `feedback_type` whitelist array: change `['bug', 'idea', 'praise', 'other']` to include `'unmet_demand'`.
- Change nothing else in this function (auth, message length validation, rate limiting, role lookup, insert, email enqueue).

### 3. `src/pages/admin/AdminFeedback.tsx`
- Extend the `FeedbackRow['feedback_type']` union to include `'unmet_demand'`.
- Add a matching entry to `TYPE_META`:
  - label: `"Unmet demand"`
  - icon: reuse an existing icon from the same file (e.g. `MessageSquare` or `MessageCircle`) — no new design tokens or colours.
  - className: reuse an existing colour pattern already present in `TYPE_META` (e.g. the slate/amber style used by `other`), keeping the same `bg-...-500/10 text-...-700 border-...-500/30` structure.
- Add `"unmet_demand"` as a filter option in the type filter `<Select>` so admins can view unmet-demand submissions.
- No other changes.

## Out of scope
- No changes to the public vendor directory, feedback button, or any other component.

## 4. New migration file in `supabase/migrations/`
- Drop the existing `feedback_feedback_type_check` CHECK constraint on `public.feedback.feedback_type` (confirmed present; current allowed values: `'bug'`, `'idea'`, `'praise'`, `'other'`).
- Recreate it with the new value included:
  ```sql
  ALTER TABLE public.feedback DROP CONSTRAINT feedback_feedback_type_check;
  ALTER TABLE public.feedback ADD CONSTRAINT feedback_feedback_type_check
    CHECK (feedback_type IN ('bug','idea','praise','other','unmet_demand'));
  ```
- No other table or policy changes.

