

## Add Google OAuth (Sign-in + Sign-up) with Callback & Profile Completion

### Overview
Three files: modify AuthPage.tsx (add Google button to registration role screen + profile completion step), create AuthCallback.tsx, update App.tsx routes.

**Important**: The login screen already has a Google OAuth button (lines 628-665). The user wants it to also work for sign-up, plus proper post-OAuth handling.

---

### 1. Create `src/pages/auth/AuthCallback.tsx`

Handles the OAuth redirect at `/auth/callback`:
- On mount, calls `supabase.auth.getSession()`
- If no session, redirects to `/auth`
- If session exists, checks `profiles` table for the user:
  - Fetches profile by `user_id`
  - Extracts `full_name` and `avatar_url` from `session.user.user_metadata`
  - If profile has no `first_name` or no `phone_number` (incomplete): updates profile with Google metadata (full_name, avatar_url), then navigates to `/auth?step=complete-profile`
  - If profile is complete: navigates to `/`

### 2. Update `src/App.tsx`

Add to the unauthenticated routes block (lines 68-75):
```
<Route path="/auth/callback" element={<AuthCallback />} />
```
Import AuthCallback at top.

### 3. Update `src/pages/auth/AuthPage.tsx`

**A. Add Google button to the role selection screen** (step === 'role', lines 812-886):
- Before the role cards, add Google button + "or" divider
- Same styling as login screen's Google button
- Uses `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + '/auth/callback' })`
- Divider text: "or continue with phone"

**B. Update existing login Google button redirect_uri** (line 636):
- Change `redirect_uri` from `window.location.origin` to `window.location.origin + '/auth/callback'`

**C. Add `complete-profile` step handling**:
- Read `searchParams.get('step')` — if value is `'complete-profile'`, show profile completion form
- Add a new early return block (before the login block) that renders:
  - Full name field (pre-filled from profile via a useEffect that fetches current profile)
  - Phone number field (required, SA format with +27 prefix)
  - Note: "We need your number to connect you with vendors"
  - Submit button that updates profile (`first_name`, `surname`, `phone_number`, `phone_verified: false`, `is_profile_complete: true`) then navigates to `/`

---

### Files

| File | Action |
|------|--------|
| `src/pages/auth/AuthCallback.tsx` | Create (~60 lines) |
| `src/App.tsx` | Add 1 route + 1 import |
| `src/pages/auth/AuthPage.tsx` | Add Google to role screen, update redirect_uri, add complete-profile step (~80 lines) |

No database changes needed.

