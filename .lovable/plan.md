# Add audience-aware HowItWorks steps for vendors

## Goal
Show vendors their own 5-step journey inside the existing `HowItWorks` component, while keeping the organiser's 6-step journey unchanged on the planner onboarding page.

## Changes

### 1. `src/components/onboarding/HowItWorks.tsx`

- Rename `STEPS` to `PLANNER_STEPS`; leave all six entries untouched.
- Add `VENDOR_STEPS: Step[]` with five entries, alternating `align` starting with `'left'`. All entries use:
  - `role: 'Vendor'`
  - `roleColor: '#0F6E56'`
  - `bg: '#F0FAF6'`
  - `border: '#9FE1CB'`
- Vendor step copy:
  1. **Create your profile** — Add your business name, categories, photos and the areas you serve. (Icon: `Sparkles`)
  2. **Complete verification** — Submit your documents so families know your business is genuine. (Icon: `ShieldCheck`)
  3. **Receive enquiries** — Families planning ceremonies send service requests straight to your profile. (Icon: `MessageCircle`, newly imported)
  4. **Send quotations** — Reply with a formal quotation in the app and agree the details by chat. (Icon: `ReceiptText`)
  5. **Fulfil the booking** — Deliver on the day, upload proof, and get paid into your bank account. (Icon: `CircleCheck`)
- Add prop `audience?: 'planner' | 'vendor'` defaulting to `'planner'`.
- Select the array to map based on `audience`.
- When `audience === 'vendor'`, change the sub-heading under "How UMCIMBI works" to: "From profile to payment — here's the journey".
- Keep the main heading, SVG connector logic, refs, layout, spacing and all styling unchanged.

### 2. `src/pages/vendors/VendorLandingPage.tsx`

- Pass `audience="vendor"` to the existing `<HowItWorks />` call at line 171.

### 3. `src/pages/onboarding/OnboardingLanguage.tsx`

- Leave the `<HowItWorks />` call at line 343 unchanged so planners continue seeing the six organiser steps.

## Out of scope
No other files are modified. The component's default behaviour remains the planner journey, preserving all existing call sites.
