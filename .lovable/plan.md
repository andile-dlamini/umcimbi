

## Implementation Plan — 5 Features in Risk-Ordered Sequence

The approved plan will be implemented in this exact order:

### Phase 1: Structured Pricing Input (Feature 2)
- Create `src/lib/pricingModels.ts` — types, configs for 14 categories, serialiser, parser
- Create `src/components/vendors/PricingInput.tsx` — category-aware form with live preview
- Update `VendorOnboarding.tsx`, `VendorProfile.tsx`, `AuthPage.tsx` — swap price Input for PricingInput

### Phase 2: Quick Vendor Registration (Feature 5)
- Update `VendorOnboarding.tsx` — read `?quick=true`, show simplified 4-field form
- Update `VendorDashboard.tsx` — incomplete profile banner

### Phase 3: Ceremony Journey Timeline (Feature 1)
- Create `src/components/shared/CeremonyJourney.tsx` — horizontal scrollable timeline with 3 journey paths
- Update `Home.tsx` — integrate CeremonyJourney using `events.map(e => e.event_type)`, add learnArticles lookup

### Phase 4: Vendor Referral Links (Feature 4)
- Update `AuthPage.tsx` — read `ref` param, pre-select vendor role, show Ndabe co-branded banner
- Update `App.tsx` — add `/join/vendor` → `/auth?mode=register&role=vendor&ref=ndabe` redirect
- DB migration: add `signup_source` text column to vendors table

### Phase 5: Waitlist Gate (Feature 3)
- DB migration: create `waitlist_signups` table with RLS
- Create `src/pages/WaitlistPage.tsx` — countdown to `2026-05-25`, signup form, success state
- Update `App.tsx` — add `/waitlist` route
- Update `OnboardingLanguage.tsx` — registration CTAs → `/waitlist`
- Update `AdminDashboard.tsx` — waitlist stat card

### Files Summary

| Phase | Files | Action |
|-------|-------|--------|
| 1 | `src/lib/pricingModels.ts` | Create |
| 1 | `src/components/vendors/PricingInput.tsx` | Create |
| 1 | `VendorOnboarding.tsx`, `VendorProfile.tsx`, `AuthPage.tsx` | Edit (swap Input) |
| 2 | `VendorOnboarding.tsx` | Edit (quick mode) |
| 2 | `VendorDashboard.tsx` | Edit (banner) |
| 3 | `src/components/shared/CeremonyJourney.tsx` | Create |
| 3 | `Home.tsx` | Edit |
| 4 | `AuthPage.tsx`, `App.tsx` | Edit |
| 4 | Migration: `vendors.signup_source` | Create |
| 5 | `src/pages/WaitlistPage.tsx` | Create |
| 5 | `App.tsx`, `OnboardingLanguage.tsx`, `AdminDashboard.tsx` | Edit |
| 5 | Migration: `waitlist_signups` | Create |

