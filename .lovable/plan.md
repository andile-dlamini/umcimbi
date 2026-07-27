Replace the hero headline, subtext, checklist, and CTA buttons on the landing page (`src/pages/onboarding/OnboardingLanguage.tsx`) with a two-question entry gate that reuses the same icon pairing as the AuthPage role-choice screen.

What will change:
1. Import block (around line 32): add `PartyPopper` and `Store` to the existing `lucide-react` import.
2. Lines 207–226: replace headline/subtext/checklist with the prompt "What brings you to UMCIMBI?" and two glassmorphism buttons:
   - Organiser button: `PartyPopper` icon, eyebrow "For families", label "Are you organising a traditional ceremony?", scrolls to `#organisers`.
   - Vendor button: `Store` icon, eyebrow "For businesses", label "Are you providing vendor services?", scrolls to `#vendors`.
   Both use the existing `ArrowRight` icon and `scrollTo()` helper.
3. Lines 229–239: remove the "Get started" and "Login" button links (login remains accessible via top nav).

What will NOT change:
- `scrollTo()`, PWA install logic, `HeroSereneIllustration`, right-hand illustration column.
- Header nav, mobile menu, `#organisers`, `#vendors`, and all sections below the hero.
- No routing, schema, or role system changes.

Verification:
- Typecheck (`tsgo` or `bunx tsc --noEmit`).
- Visual check of the preview landing page, confirming both button labels and icons are clearly legible against the hero background.