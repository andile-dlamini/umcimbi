# Make signup social fields accept handles and deduplicate helpers

Move the existing social-link helpers to a shared library, import them everywhere, and update the signup form to accept handles like the profile forms already do.

## Changes

### 1. New file: src/lib/socialLinks.ts

Move the existing `toSocialUrl` and `extractSocialHandle` functions here, exported. Keep their current logic unchanged: strip a leading `@`, pass through full `http(s)` URLs, and build `https://instagram.com/`, `https://tiktok.com/@` and `https://facebook.com/` URLs.

### 2. src/components/vendors/VendorProfileForm.tsx

- Delete the local `toSocialUrl` and `extractSocialHandle` definitions.
- Import both from `@/lib/socialLinks`.
- No other behaviour change.

### 3. src/pages/profile/VendorProfile.tsx

- Delete the local `toSocialUrl` definition.
- Import `toSocialUrl` from `@/lib/socialLinks`.
- Keep the local `toHandle` helper (it is not the same as `extractSocialHandle`).
- No other behaviour change.

### 4. src/pages/auth/AuthPage.tsx

- Import `toSocialUrl` from `@/lib/socialLinks`.
- In `handleFinalVendorSubmit`, replace `normalizeUrl(vendorForm.instagram_url)` with `toSocialUrl('instagram', vendorForm.instagram_url)`, and do the same for `facebook` and `tiktok` with their matching platform keys.
- Change the three social input placeholders from "Instagram link (optional)", "Facebook link (optional)", "TikTok link (optional)" to the handle-style wording used in `VendorProfileForm`: "e.g. maswazicatering" (the platform is already named in the label above the inputs).
- Remove the local `normalizeUrl` helper if it is no longer used anywhere in the file.
- Leave the at-least-one-social validation, service regions logic, vendors insert columns, registered-business fields, photo step, and every other part of the signup flow unchanged.

## Unchanged

- The social validation rule in `handleBusinessSubmit`.
- Service region selection and persistence.
- The vendors insert beyond the three social columns.
- Google signup path, planner path, success screen, step machine, `getSteps`, `backMap`, wizard steps, and upload logic.
- `VendorServiceRegions.tsx` and `VendorProfile.tsx` read-only display sections.

## Verification

- Typecheck passes.
- Build passes.
- Signup social inputs show handle-style placeholders and store normalized URLs in the database.
