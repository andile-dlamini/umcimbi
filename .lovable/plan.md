## Wire page navigation into onboarding tour

Three targeted edits to make the tour navigate to the relevant route as the user steps through it.

### 1. `src/components/onboarding/OnboardingTour.tsx`
- Import `useNavigate` from `react-router-dom`.
- Add optional `navigateTo?: string` field to the `TourStep` interface.
- Initialize `const navigate = useNavigate()` inside the component.
- Update the step-change `useEffect` to:
  - Call `navigate(step.navigateTo)` first when present.
  - Defer the `querySelector` + `scrollIntoView` + `measure` inside a `setTimeout(..., 150)` to allow the route to render before measuring, with a cleanup `clearTimeout`.
  - Fallback to `measure()` if the target isn't found yet.

### 2. `src/config/plannerTourSteps.ts`
Replace file contents with the new array that adds `navigateTo` to each sidebar/nav step:
- `planner-ceremonies` → `/`
- `nav-events` → `/events`
- `nav-vendors` → `/vendors`
- `nav-messages` → `/chats`
- `nav-quotes` → `/quotes`
- `nav-orders` → `/bookings`
- Final center step → `/`

### 3. `src/config/vendorTourSteps.ts`
Replace file contents with the new array that adds `navigateTo` to each step:
- `vendor-kpis` → `/vendor-dashboard`
- `vendor-quick-links` → `/vendor-dashboard`
- `nav-messages` → `/chats`
- `nav-vendor-quotations` → `/vendor-dashboard/quotations`
- `nav-vendor-orders` → `/vendor-dashboard/orders`
- Final center step → `/vendor-dashboard`

No other files touched.
