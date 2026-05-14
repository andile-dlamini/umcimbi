## Remove Google OAuth from signup flow

In `src/pages/auth/AuthPage.tsx`, delete lines **1110–1139** — the entire `{/* Google OAuth */}` comment, the `<Button>` block (with its handler and inline SVG), and the trailing blank line before the "or continue with phone" divider.

The login screen Google button (lines 820–847), `CompleteProfileStep` Google-related logic, and `AuthCallback.tsx` remain untouched.

### Result

Signup `auth_method` step shows only the phone option; existing users can still sign in via Google on the login screen.