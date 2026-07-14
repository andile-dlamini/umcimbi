## Corrections acknowledged

- **Shweshwe palette**: dropped from the plan. The banner will use existing semantic Tailwind tokens (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, etc.) already defined in `index.css`. No hardcoded colors.
- **Lovable-preview guard**: you're right, I couldn't find one either — I confirmed with `grep -rn "serviceWorker\|pwa-register\|registerSW\|lovableproject" src/ vite.config.ts` and got zero hits. Nothing in `src/` currently touches the SW registration surface. The plan now uses an explicit `'serviceWorker' in navigator` check inside the hook, and the hook returns inert values otherwise.
- **Single hook call**: `usePwaUpdate()` is called exactly once in `App.tsx`. `needRefresh` and `refresh` are passed down as props to both `UpdateBanner` and `AppShell`.

## Plan

**1. `src/hooks/usePwaUpdate.ts` (new)**

- Guard: if `typeof navigator === 'undefined' || !('serviceWorker' in navigator)`, return `{ needRefresh: false, refresh: () => {} }` without importing/using `useRegisterSW`.
- Otherwise: use `useRegisterSW` from `virtual:pwa-register/react` and expose:
  - `needRefresh: boolean`
  - `refresh(): void` — calls `updateServiceWorker(true)`.
- No dismiss / no `setNeedRefresh(false)` export.

**2. `src/components/layout/UpdateBanner.tsx` (new)**

- Props: `{ needRefresh: boolean; onRefresh: () => void }`.
- Returns `null` when `!needRefresh`.
- Fixed banner pinned to the bottom, full width, using semantic tokens only (`bg-background`, `border-t border-border`, `text-foreground`, shadcn `Button` with default `primary` variant). Respects `env(safe-area-inset-bottom)`. Z-index above the mobile bottom nav.
- Copy: "A new version of UMCIMBI is available." + "Refresh now" button wired to `onRefresh`.

**3. `src/App.tsx`**

- Call `usePwaUpdate()` once inside the `App` component.
- Render `<UpdateBanner needRefresh={needRefresh} onRefresh={refresh} />` at the top level, outside `<BrowserRouter>`.
- Pass `needRefresh` into `<AppRoutes />` → down to `<AppShell />` (added prop) so `AppShell` can add conditional bottom padding to `<main>` matching the banner height, keeping the bottom nav's tap targets reachable on mobile.

**4. Not touched**

- `vite.config.ts` / Workbox config.
- Existing Sonner/toast wiring.
- Anything outside the three files above.

## Technical notes

- No new dependencies; `vite-plugin-pwa` is already installed.
- The `virtual:pwa-register/react` import lives only in the branch that runs after the `'serviceWorker' in navigator` check, so environments without SW support don't hit the module.
- Banner uses shadcn `Button` for consistency; no ad-hoc color classes.
