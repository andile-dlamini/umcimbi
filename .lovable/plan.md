## Change
In `src/pages/auth/AuthPage.tsx` (line 559), replace:

```
        setStep('business');
```

with:

```
        navigate('/vendors/onboarding', { replace: true });
```

## Context
After a vendor creates an account via the unified onboarding wizard (`selectedRole === 'vendor'`), the current code advances the inline wizard to the `business` step (`setStep('business')`). The standalone `VendorOnboarding` page at `/vendors/onboarding` is now the preferred vendor setup flow.

## Scope
- **Only file modified:** `src/pages/auth/AuthPage.tsx`
- **No other changes.** The `business`/`showcase`/`success` steps remain in the file for any other callers or fallback flows.
- **No backend migration required.**