## Goal

When a logged-in user lands on `/auth` with `?role=vendor` (e.g. via `/join/vendor`), and they already have the `vendor` role but no row in `vendors`, route them into the vendor business setup instead of bouncing them home.

## File

`src/pages/auth/AuthPage.tsx` — modify only the redirect `useEffect` at lines 319–326.

## Change

Replace the existing effect with an async check:

1. If `user` is logged in AND `step === 'login'` AND not in a wizard step:
   - If URL has `role=vendor`:
     - Query `supabase.from('vendors').select('id').eq('owner_user_id', user.id).maybeSingle()`.
     - If no row exists → `setSelectedRole('vendor')` and `setStep('business')` (keeps them in this page to finish the vendor wizard). No navigation.
     - If a vendor row exists → `navigate('/', { replace: true })` (current behaviour).
   - Otherwise → `navigate('/', { replace: true })` (current behaviour).

Use a cancelled flag inside the effect to avoid setting state after unmount. Add `searchParams` to the dependency array.

## Out of scope

- The alternative `/vendor-dashboard/onboarding` redirect mentioned in the request is not used — staying on AuthPage and jumping to the `business` step matches the existing wizard flow (`business` is already a valid `Step`, and the form's submit handler at line ~588 already inserts the vendor row for the current `auth.uid()`).
- No other logic, styling, or files are touched.
