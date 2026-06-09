## Goal
Split the existing single vendor onboarding form into a two-step flow (Step 4 — Business details, Step 5 — Showcase), add a 5-step visual progress stepper (when launched from the auth flow), add South African bank payout fields, and drop the now-redundant phone/email/website fields (vendor phone is reused from the user profile).

## Files changed
1. `src/pages/vendors/VendorOnboarding.tsx` — complete rewrite of the non-quick path; quick-mode (`?quick=true`) preserved.
2. `src/pages/auth/AuthPage.tsx` — one-line change: append `?fromAuth=true` to the post-signup vendor redirect so the stepper renders.

No other files. No migration (bank columns already exist on `vendors`).

## VendorOnboarding.tsx — what changes

**Imports**
- Add: `useAuth` from `@/context/AuthContext`; `AlertTriangle`, `ChevronRight` from `lucide-react`.
- Remove: `Phone`, `Mail`, `Globe` from `lucide-react` (unused after field removal).

**Constants (added after `toSocialUrl`)**
- `SOUTH_AFRICAN_BANKS` — 9 SA banks each with `name` and `branchCode` (ABSA, African Bank, Capitec, Discovery, FNB, Investec, Nedbank, Standard Bank, TymeBank).
- `ACCOUNT_TYPES` — `['Current / Cheque', 'Savings', 'Transmission']`.

**Schema**
- `vendorSchema` updated: `about` and `price_range_text` now required; `phone_country`, `phone_number`, `email`, `website_url` removed.
- `quickVendorSchema` unchanged.

**State**
- `formData` initial state drops `phone_country`, `phone_number`, `email`, `website_url`; adds `bank_name`, `bank_branch_code`, `bank_account_holder_name`, `bank_account_number`, `bank_account_type`.
- Remove `phoneCountryOpen` state and `selectedPhoneCountry` derived value.
- Add `const fromAuth = searchParams.get('fromAuth') === 'true';`
- Add `const [onboardingStep, setOnboardingStep] = useState<4 | 5>(4);`
- Add `const { profile } = useAuth();`

**New handler**
- `handleNextStep`: validates Step 4 minimum fields (`name`, `category`), sets errors, scrolls to top, advances to Step 5.

**handleSubmit**
- Removes all phone validation (`validateLocalPhone`, `toE164`, `selectedPhoneCountry`) and website URL normalization from the non-quick path.
- `dataToValidate` simplified — quick path only validates `name`, `category`, `city`; full path validates `{ ...formData, ...address }`.
- `createVendorProfile` call: drops `phone_number` (now `profile?.phone_number || null`), `email` (null), `website_url` (null); adds the five bank fields. Image upload, verification doc upload, vendor record update, SMS invocation, and `navigate(isQuickMode ? '/vendor-dashboard' : '/profile/vendor')` all preserved unchanged.

**Helpers preserved as-is**
- `validateLocalPhone`, `toE164`, `toSocialUrl`, all image/showcase/verification doc upload logic, the `useMyVendorProfile` redirect-if-exists effect, and `quickVendorSchema` for quick mode.

**JSX**
- Quick mode (`isQuickMode`): keeps the existing single-card form layout, but with `phone_country`, `phone_number`, `email`, `website_url` fields removed.
- Non-quick mode: new two-step layout wrapped in one `<form onSubmit={handleSubmit}>`:
  - Optional 5-step visual stepper (rendered only when `fromAuth === true`) showing Details / Verify / Password / Business / Showcase, with circles 1-3 shown as completed (`✓`), Step 4 active or done depending on `onboardingStep`, Step 5 active only when on Step 5. Connector lines tint based on progress.
  - **Step 4 — Business details:** logo upload (existing logic), business name, category select, registered-business toggle with conditional registered name / registration number / VAT / verification doc upload (existing logic) OR a friendly "no worries" panel when the toggle is off, bank details block (bank select auto-fills branch code, account holder, account number, account type select, read-only branch code). Footer "Next — Showcase your work" button calls `handleNextStep` (type="button"; does not submit).
  - **Step 5 — Showcase:** back link to Step 4, info banner explaining description + pricing are required, `Textarea` for `about`, `AddressFields`, `PricingInput`, showcase gallery (existing logic), social links (Instagram / TikTok / Facebook — username inputs only), and the final `type="submit"` "Submit for review" button which runs `handleSubmit`.

## AuthPage.tsx — what changes
Replace the single line:
```
navigate('/vendors/onboarding', { replace: true });
```
with:
```
navigate('/vendors/onboarding?fromAuth=true', { replace: true });
```
This causes the stepper to appear when a vendor lands on onboarding straight after sign-up; opening `/vendors/onboarding` from anywhere else hides the stepper.

## Risks / preserved behaviour
- Quick-mode flow (`?quick=true`) remains the original single-card form (with phone/email/website removed). Functionality and `/vendor-dashboard` redirect preserved.
- Vendor phone is now sourced from the authenticated user's profile (`profile.phone_number`). If the profile lacks a phone, the vendor record stores `null` — acceptable since vendor phone collection is being deprecated in favour of the user's verified phone.
- Bank fields are optional at submit time (no zod requirement) — an in-form warning tells the vendor the profile won't go live without them, matching the requested copy.
- SMS notification, image/showcase/verification doc upload, and post-submit navigation are untouched.
