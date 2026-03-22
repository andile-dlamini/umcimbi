

## Plan: Restructure Registration Flow + Add Home Nav Item

Two files to modify.

---

### 1. `src/pages/auth/AuthPage.tsx` — Move Google button after role selection

**A. Add `auth_method` to Step type** (line 106):
```
type Step = 'role' | 'auth_method' | 'details' | 'otp' | ...
```

**B. Update `getSteps()`** (lines 109-113): Insert `auth_method` after `role` in both planner and vendor arrays. Update `OnboardingStepper` to filter out `auth_method` alongside `role` and `success` (line 118).

**C. Modify role selection screen** (lines 948-1059):
- Remove the Google OAuth button and "or continue with phone" divider (lines 963-1000)
- Change role card `onClick` from `setStep('details')` to `setStep('auth_method')` (lines 1005, 1028)
- Everything else stays identical

**D. Add new `auth_method` step block** — inserted right after the role selection block (after line 1059):
- Back arrow → returns to `role`
- Role badge: "Registering as: Ceremony Planner" or "Registering as: Service Provider"
- Comment: `// Role must always be selected before auth method to ensure correct post-registration routing`
- Google OAuth button (same visual as current) calling `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + '/auth/callback?role=' + selectedRole })`
- Divider: "OR CONTINUE WITH PHONE"
- "Continue with Phone" button → `setStep('details')`

**E. Update `backMap`** (line 1091-1097):
- Add `auth_method: 'role'`
- Change `details: 'role'` → `details: 'auth_method'`

**F. Login flow**: No changes. The login screen (line 740) already has Google + phone without role selection.

---

### 2. `src/pages/auth/AuthCallback.tsx` — Read role from query params

- Parse `role` from `window.location.search`
- For incomplete profiles: navigate to `/auth?step=complete-profile&role=user` or `&role=vendor`
- For complete profiles: navigate to `/` as before

---

### 3. `src/components/layout/AppSidebar.tsx` — Add Home nav item

- Import `Home` from `lucide-react` (add to line 4 imports)
- Add `{ to: '/', icon: Home, label: 'Home' }` as first item in `organiserItems` array (before line 100)
- Add `{ to: '/', icon: Home, label: 'Home' }` as first item in `vendorItems` array (before line 108)
- The existing `isActive()` already handles `path === '/'` with exact match

---

### Files

| File | Changes |
|------|---------|
| `src/pages/auth/AuthPage.tsx` | Add `auth_method` step, move Google button there, update role card navigation, update backMap/stepper |
| `src/pages/auth/AuthCallback.tsx` | Read `role` query param, pass through to complete-profile redirect |
| `src/components/layout/AppSidebar.tsx` | Add Home icon import + Home nav item to both arrays |

No database changes. No new files.

