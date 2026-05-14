# Vendor Google OAuth registration fixes — `src/pages/auth/AuthPage.tsx`

Three focused edits, no other files touched.

## Fix 1 — `CompleteProfileStep.handleSubmit` (~line 196–242)

After the successful `profiles` update, branch on the URL `role` param:

- Read `const role = new URLSearchParams(window.location.search).get('role');`
- If `role === 'vendor'`:
  - `await supabase.from('profiles').update({ role: 'vendor' }).eq('user_id', user.id);`
  - `navigate('/auth?mode=signup&role=vendor&step=business-setup', { replace: true });`
- Else: `navigate('/', { replace: true });` (current behavior).

Toast and error handling stay as-is.

## Fix 2 — Logged-in redirect `useEffect` (~line 324–344)

- Replace guard
  `if (!(user && !wizardSteps.includes(step) && step === 'login')) return;`
  with
  `if (!(user && !wizardSteps.includes(step))) return;`
- When `role=vendor` and no `existingVendor` row found: drop the `setSelectedRole('vendor') / setStep('business')` branch and instead:
  ```ts
  if (!existingVendor) {
    await supabase.auth.signOut();
    if (!cancelled) navigate('/join/vendor', { replace: true });
    return;
  }
  ```
- Otherwise keep the existing `navigate('/', { replace: true })` fallback.

## Fix 3 — Honor `step=business-setup&role=vendor` on mount (~line 308–314)

Update `initialStep` so the wizard renders directly into the business step after Google OAuth:

```ts
const initialStep: Step = searchParams.get('step') === 'business-setup' && searchParams.get('role') === 'vendor'
  ? 'business'
  : searchParams.get('mode') === 'signup'
    ? (initialRole
        ? (methodParam === 'phone' ? 'details' : 'auth_method')
        : 'role')
    : 'login';
```

`initialRole` already resolves to `'vendor'` from the same `role=vendor` param, so `selectedRole` is set correctly without further changes.

Nothing else in the file changes.