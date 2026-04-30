## Plan

Update `src/context/RoleContext.tsx` so newly registered vendors land in vendor mode by default.

### Change

In the `useEffect` that loads the saved role preference, add an `else if` branch: when there is no `savedRole` in localStorage and `isVendor` is true, call `setActiveRole('vendor')`.

### File

- `src/context/RoleContext.tsx` — replace the existing `useEffect` block (lines ~19-29) with the version that includes the new `else if (!savedRole && isVendor)` branch defaulting vendors to vendor mode.

No other files are touched.