Fix role-step back arrow to always exit to /onboarding

Context
- In src/pages/auth/AuthPage.tsx the role-choice step currently computes a dynamic back destination: `redirectParam` if it starts with `/`, otherwise `/onboarding`.
- The redirect param is meant as a post-signup destination (`/vendors/<id>`), so using it as a back target sends logged-out visitors to an authenticated route, which bounces them back into auth and creates a loop.

Change
- In the role step block (around line 1071-1075), remove the `roleBackHref` conditional entirely.
- Set the `AuthHeader` `onBack` callback to `() => navigate('/onboarding')` so the back arrow always exits the signup flow to the onboarding page.
- Leave the redirect param unchanged for its intended post-signup use.
- Do not touch any other step, banner, or auth logic.

Verification
- Run a typecheck pass after the edit.
- Use Playwright to confirm:
  - `/auth?mode=signup&redirect=/vendors/<id>` shows the role step.
  - Clicking the back arrow lands on `/onboarding` (not `/vendors/<id>`).
  - The redirect param is still present in the URL after selecting a role, so post-signup redirect still works.
