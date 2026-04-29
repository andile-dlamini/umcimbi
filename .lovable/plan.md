# Universal Onboarding Tour

Add a one-time, role-specific guided tour for new planners and vendors using pure React + DOM APIs (no new dependencies). Tour state persists in localStorage and is replayable from Settings.

## Files to Create

1. **`src/components/onboarding/OnboardingTour.tsx`** — Portal-based tour overlay with dimmed backdrop, spotlight cut-out around the target element, and a tooltip card supporting `center | right | bottom | top` placements. Handles step navigation (Back/Next/Let's go), close (X), progress dots, and re-measures on resize/scroll.

2. **`src/hooks/useOnboardingTour.ts`** — `useOnboardingTour(role)` hook returning `{ tourActive, completeTour }`. Auto-activates after a 900ms delay if the per-role localStorage key is unset. Exports `clearTour(role)` for replay from Settings. Keys: `umcimbi_planner_tour_v1`, `umcimbi_vendor_tour_v1`.

3. **`src/config/plannerTourSteps.ts`** — 8-step planner tour: welcome → ceremonies grid → events → vendors → messages → quotes → orders → outro.

4. **`src/config/vendorTourSteps.ts`** — 9-step vendor tour: welcome → KPIs → quick-links → messages → quotations → orders → escrow explainer → outro.

## Files to Modify

5. **`src/components/layout/AppSidebar.tsx`** — Add `dataTour` field to `organiserItems` and `vendorItems`. In the `navItems.map()` destructure `dataTour` and apply `data-tour={dataTour}` to the rendered nav button (both expanded and collapsed branches share the same `button` JSX, so a single edit covers both).

6. **`src/pages/Home.tsx`** —
   - Add imports for `OnboardingTour`, `useOnboardingTour`, `PLANNER_TOUR_STEPS`.
   - Call `useOnboardingTour('planner')` after existing hooks.
   - Add `data-tour="planner-ceremonies"` to the `grid grid-cols-2 gap-3` ceremony picker grid.
   - Add `data-tour="planner-quick-actions"` to the `grid grid-cols-3 gap-3` quick-actions grid.
   - Render `{tourActive && <OnboardingTour … />}` in all three return branches (loading, empty, populated).

7. **`src/pages/vendor-dashboard/VendorDashboard.tsx`** —
   - Add imports for `OnboardingTour`, `useOnboardingTour`, `VENDOR_TOUR_STEPS`, `HelpCircle`.
   - Call `useOnboardingTour('vendor')`.
   - Add `data-tour="vendor-kpis"` to the KPI `grid grid-cols-2 gap-3`.
   - Add `data-tour="vendor-quick-links"` to the quick-links `grid grid-cols-2 gap-3`.
   - Add a `rightAction` HelpCircle button on `<PageHeader>` that clears the localStorage key and reloads.
   - Render `{tourActive && <OnboardingTour … />}` at the bottom of the return.

8. **`src/pages/Settings.tsx`** —
   - Extend imports (add `HelpCircle`, `PlayCircle` from lucide-react; import `clearTour`; `useNavigate` already imported).
   - Add `handleReplayTour` that clears the role-appropriate key and navigates to `/vendor-dashboard` or `/`.
   - Append a new "Help" Card after the existing cards with a "Replay platform tour" button.

## Technical Notes

- **No new dependencies.** Tour uses `createPortal`, `getBoundingClientRect`, and inline styles only.
- **Targeting**: each step references either `'center'` (modal mode, no spotlight) or a CSS selector like `'[data-tour="nav-events"]'`.
- **Robustness**: `OnboardingTour` re-measures on `resize`, scrolls the target into view on step change, and falls back to centered placement if the target is missing.
- **Role gating**: planner tour only fires on `/` for non-vendor users (Home component), vendor tour only fires on `/vendor-dashboard` for vendors. Admins see neither (they don't land on those routes by default after onboarding).
- **Replay**: clearing the localStorage key + navigating to the home route causes the hook's `useEffect` to re-trigger the 900ms activation timer.
- **Z-index**: tour overlay uses `z-index: 10001` to sit above sidebar and any sticky headers.

## Out of Scope

- No changes to routing, auth, RLS, or backend.
- No changes to existing classNames, logic, or layout beyond adding `data-tour` attributes and the tour mount points.
- No admin tour.
