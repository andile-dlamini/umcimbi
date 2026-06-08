## Summary
Add a public selfie-submission page for vendor identity verification and wire it into the router.

## Changes

### 1. New page — `src/pages/vendor/SelfieSubmission.tsx`
Public standalone page (no AppShell, no auth gate).
- Reads `token` from `?token=` query param.
- Invalid / missing token: shows error message.
- Valid token: branded header (indigo #111872 background, gold #E8A838 "UMCIMBI" text), "Identity Verification" title, instructions, file input with `capture="user"`, image preview.
- Submit: FileReader → base64, call `supabase.functions.invoke('vendor-selfie-submission', { body: { token, photo_base64, mime_type } })` with no auth header.
- Success: full-page thank-you in brand colours.
- Error: inline error message.
- Loading spinner while submitting.

### 2. Route addition — `src/App.tsx`
- Add import for `SelfieSubmission`.
- Add `<Route path="/verify/selfie" element={<SelfieSubmission />} />` in both the unauthenticated block and the authenticated block (same pattern as `/feedback/*` routes), outside `AppShell`.

## Out of scope
- No backend / edge-function changes (already deployed).
- No migration needed.
- No AppShell or auth wrapper.