## Two targeted fixes

### Fix 1 — `src/components/onboarding/OnboardingTour.tsx`

Make the tooltip card responsive and auto-flip when it would overflow the viewport.

- Remove module-level constants `CARD_W = 320` and `CARD_H_APPROX = 210`.
- Inside the component, just after `const vw = window.innerWidth; const vh = window.innerHeight;`, declare:
  - `const CARD_W = Math.min(320, vw - 32);`
  - `const CARD_H_APPROX = 260;`
- Update the `'top'` and `'bottom'` cases in `cardStyle()` to flip to the opposite side when there isn't enough room (per the exact code provided in the request).

### Fix 2 — `src/config/plannerTourSteps.ts`

Change the `[data-tour="planner-ceremonies"]` step's `placement` from `'bottom'` to `'top'` so the tooltip doesn't get pushed off-screen by the tall ceremony grid.

### Note on Settings.tsx

The three Settings.tsx fixes described in the message are already present in the current file (email filter, address fields in edit/view, `justify-start` on the Edit Vendor Profile button). No changes needed there.
