# Vendor tiles, section contrast, and a way out of signup

Five focused changes: a logo bug, two removals, a contrast fix, and orientation in the signup flow.

## 1. Vendor tile shows the logo (VendorTile.tsx)

- Flip image priority to `vendor.logo_url || vendor.image_urls?.[0]` so vendors with gallery photos still show their logo.
- Add local `imageFailed` state with an `onError` handler on the `img`; when there is no URL or loading failed, render the existing letter placeholder instead of an empty grey box.
- No layout, sizing or styling changes.

## 2. Remove "See the full directory" (VendorLandingPage.tsx)

Delete the button and its wrapping div from the "See who is already listed" section. The hash-scroll effect on the landing page stays as-is.

## 3. Remove the join line (OnboardingLanguage.tsx)

Delete the paragraph "Free to join. Takes less than a minute." from the organisers section (line 337).

## 4. Section contrast on both public pages

- Give "See who is already listed" a distinctly deeper dark tone than the hero overlay plus a visible top border (a light hairline such as `border-t border-white/10`), keeping it dark so the white-on-dark browser markup still reads.
- Apply the same treatment to the landing page boundary between the hero and the organisers section if the two currently read as one block.

## 5. Orientation and exits in the auth flow (AuthPage.tsx)

- **5a.** Add one compact, lightweight header used by the `login`, `role`, `auth_method`, `forgot_phone`, `forgot_otp` and `forgot_password` steps: existing back arrow on the left, UMCIMBI logo (`/images/umcimbi-logo.png`) linking to `/onboarding`.
- **5b.** The role step's back arrow always leaves auth and goes to `/onboarding`, regardless of whether a `redirect` param is present. (The `redirect` param remains the post-signup destination only.)
- **5c.** When a `redirect` param is present, show above the role / auth_method heading: "Create an account to contact this vendor" plus a plain text "Back to browsing" link to `/onboarding`. Hidden when there is no redirect param.

No changes to step logic, validation, OTP, password handling, role options, or post-signup navigation.

## Technical notes

- Files touched: `src/components/vendors/VendorTile.tsx`, `src/pages/vendors/VendorLandingPage.tsx`, `src/pages/onboarding/OnboardingLanguage.tsx`, `src/pages/auth/AuthPage.tsx`.
- Auth header will be a small local component inside AuthPage to avoid repeating markup across six steps.
- Out of scope: VendorDetail and `/vendors/:id`, quotes/bookings/payments/Ozow, any database or RLS change, VendorsList / useVendors / useVendorsWithDistance / VendorCard, VendorBrowser behaviour, and section order on either page.

## Verification

Browser check: a vendor with logo + gallery shows the logo; a broken URL shows the letter fallback; the vendor page boundary between the first two sections is visible; every listed auth screen shows the logo and it returns to `/onboarding`; the role back arrow exits auth instead of showing login.
