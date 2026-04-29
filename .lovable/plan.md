# Add replayTour helper to onboarding hook

Two small, surgical changes — no other files affected.

## 1. `src/hooks/useOnboardingTour.ts`

Add a `replayTour` function alongside `completeTour` and include it in the return value:

```ts
const replayTour = () => {
  localStorage.removeItem(KEYS[role]);
  setTourActive(true);
};

return { tourActive, completeTour, replayTour };
```

This lets consumers re-trigger the tour in-place without a page reload.

## 2. `src/pages/vendor-dashboard/VendorDashboard.tsx`

- Destructure `replayTour` from the hook:
  ```ts
  const { tourActive, completeTour, replayTour } = useOnboardingTour('vendor');
  ```
- Replace the inline `localStorage.removeItem(...) + window.location.reload()` on the HelpCircle button with:
  ```tsx
  onClick={replayTour}
  ```

## Out of scope

No other files, no styling/markup changes, no admin or planner-side modifications.
