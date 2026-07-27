## Goal
On the landing page, give the Organisers and Vendors sections their own top CTA with reassurance copy, drop the generic subhead lines, and route both top and bottom CTAs into sign-up with the audience role pre-selected.

## Changes (single file: `src/pages/onboarding/OnboardingLanguage.tsx`)

1. **Organisers header block** (around line 307): remove the "Plan your UMCIMBI with tools that actually help." subhead, add `mb-6` to the heading, insert a "Register to start planning" button linking to `/auth?mode=signup&role=planner`, followed by "Free to join. Takes less than a minute."
2. **Organisers bottom CTA** (around line 327): change the link to `/auth?mode=signup&role=planner`; button text unchanged.
3. **Vendors header block** (around line 348): remove the "Grow your ceremony business with qualified leads." subhead, heading gets `mb-6`, insert an "I'm a vendor — Register" button linking to `/auth?mode=signup&role=vendor`, followed by "Free to list your business. Approved within 48 hours."
4. **Vendors bottom CTA** (around line 372): change the link to `/auth?mode=signup&role=vendor`.

## Technical notes
`AuthPage.tsx` already reads a `role` query param and derives `initialRole`/`initialStep` from it (lines 314-321), so `role=planner` / `role=vendor` skips the "How will you use UMCIMBI?" step with no auth-side changes.

## Untouched
Header and mobile-drawer Register buttons, the "How it works" CTA (all stay generic `/auth?mode=signup`), hero, `id="how"`, `id="faq"`, the value cards, and `AuthPage.tsx`.

## Verification
- Typecheck.
- Playwright screenshots of both sections showing top CTA + reassurance line and the retained bottom CTA.
- Click-through from each section's CTA confirming `/auth` opens at the phone-entry step rather than the role-choice screen.
