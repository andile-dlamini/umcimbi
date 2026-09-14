# Plan: Add /complete-profile route for unfinished vendor business profiles

## What we're changing

Add a new route `/complete-profile` that detects whether a vendor has finished their business profile and either sends them to the vendor dashboard or drops them into the vendor business-setup step in the signup wizard. It must work whether the user is signed in or not.

## Files to change

### 1. New file: `src/pages/vendors/CompleteProfile.tsx`

Create a small routing component with the following behaviour:

- Render a centred "Loading..." message (same markup as `AppRoutes`) while deciding.
- Read `useAuth()`.
- If `isLoading` is true, render the loading state and do nothing.
- Use `useNavigate()` and `useSearchParams()` from `react-router-dom`.
- Read any `ref` search param from the incoming URL.
- Guard against state updates after unmount with a `cancelled` flag, following the pattern in `AuthPage.tsx` lines 375-398.

Effect logic after `isLoading` resolves:

- If no user: `navigate('/auth?redirect=/complete-profile' + preservedRef, { replace: true })`.
- If user exists: query `supabase.from('vendors').select('id').eq('owner_user_id', user.id).maybeSingle()`.
  - If vendor row exists: `navigate('/vendor-dashboard', { replace: true })`.
  - If no vendor row: `navigate('/auth?mode=signup&role=vendor&step=business-setup' + preservedRef, { replace: true })`.
  - On query error: log to console and `navigate('/vendor-dashboard', { replace: true })`.

`preservedRef` is `&ref=<value>` when a `ref` param is present, otherwise empty.

### 2. `src/App.tsx`

- Import `CompleteProfile` at the top alongside the other page imports.
- In the logged-out `<Routes>` block, add `<Route path="/complete-profile" element={<CompleteProfile />} />` before the `*` catch-all.
- In the logged-in `<Routes>` block, add the same route alongside the other vendor routes.

## Boundaries / out of scope

- Do not modify `AuthPage.tsx` in any way.
- Do not change sign-out logic, wizard step resolution, `initialStep`, login redirect handling, or the success/business/showcase screens.
- Do not modify any other file.
- No database migration is needed.
