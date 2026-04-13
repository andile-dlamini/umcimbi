

## Plan: Add "Get the App" Install Button to Landing Page

### 1. Create `src/hooks/usePWAInstall.ts`
Custom hook that:
- Listens for `beforeinstallprompt` event, stores in a ref
- Exposes `isInstallable` boolean (true when event available)
- Exposes `triggerInstall()` async function that calls `event.prompt()` and awaits `userChoice`
- Detects iOS via `/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream`, exposes as `isIOS`
- Cleans up listener on unmount

### 2. Update `src/pages/onboarding/OnboardingLanguage.tsx`
Import `usePWAInstall` and add an install button in the hero CTA area (lines 147-157), after the existing "Login" button:
- **Android** (`isInstallable`): "Add to Home Screen" button with Download icon → calls `triggerInstall()`
- **iOS** (`isIOS`): "Add to Home Screen" button → opens a Popover/Tooltip with Safari share instructions
- **Neither**: `{/* TODO: QR code placeholder */}` comment, render nothing
- Style: matches existing CTA buttons — rounded-full, outline variant, white border/text on dark bg

### 3. Update `src/components/shared/InstallPrompt.tsx`
Add early return at line 31 (before the existing mobile/prompt/dismissed check):
```
if (window.location.pathname === '/') return null;
```
This prevents the floating banner from showing on the landing page.

### Files Changed
| File | Action |
|------|--------|
| `src/hooks/usePWAInstall.ts` | Create |
| `src/pages/onboarding/OnboardingLanguage.tsx` | Add import + install button in hero |
| `src/components/shared/InstallPrompt.tsx` | Add pathname check |

### What Will NOT Change
Any other pages, components, or existing PWA functionality beyond the specified changes.

