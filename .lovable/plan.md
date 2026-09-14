# Add /complete-profile route for unfinished vendor profiles

## Goal
Create a small routing entry point at `/complete-profile` that sends unfinished vendors straight to business setup, signed-in or not.

## Current state
- `src/pages/vendors/CompleteProfile.tsx` already exists and matches the requested logic: loading state, no-user redirect to `/auth?redirect=/complete-profile`, vendor-row check via `maybeSingle()`, existing-vendor redirect to `/vendor-dashboard`, missing-vendor redirect to `/auth?mode=signup&role=vendor&step=business-setup`, error fallback to `/vendor-dashboard`, ref-param preservation, and cancelled-flag unmount guard.
- `src/App.tsx` already imports `CompleteProfile` and registers `/complete-profile` in both the logged-out route block and the logged-in route block.
- `AuthPage.tsx` is untouched.

## Plan
1. Verify the existing `CompleteProfile.tsx` and `App.tsx` wiring against the spec.
2. Run typecheck and confirm build is clean.
3. No file changes or migrations are required unless a discrepancy is found.
