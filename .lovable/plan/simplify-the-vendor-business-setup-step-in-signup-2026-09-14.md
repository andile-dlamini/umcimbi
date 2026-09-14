# Simplify the vendor business setup step in signup

Trim the vendor signup "business" step down to the essentials, and collect social links and service areas instead of address, phone and free-text business details. All changes are in `src/pages/auth/AuthPage.tsx`.

## What the vendor will see

The business step asks for:
- Business name and category (as today)
- The registered-business toggle and its document upload (unchanged)
- Instagram, Facebook and TikTok links, with one label above them saying at least one is needed
- Service areas, using the existing region picker

Removed from that step: business address, phone number and country selector, description, price range, email and website.

The photo step now requires at least one showcase photo before finishing. The logo stays optional.

## Validation

- Business step: name and category required as now; at least one social link must be filled, otherwise the error "Please add at least one social media link"; at least one service area must be selected, otherwise "Please select at least one service area". The phone validation is dropped.
- Photo step: finishing with no showcase photo shows "Please add at least one photo".

## Technical detail

- `vendorSchema` (~line 89) reduced to `name` and `category` only; address, phone, about, price range, email and website keys removed.
- `vendorForm` state gains `instagram_url`, `facebook_url`, `tiktok_url` (empty strings). New local state holds the selected service-region ids.
- `<VendorServiceRegions vendorId={null} value={...} onChange={...} />` rendered in the business step; the component itself is not modified.
- `handleBusinessSubmit`: after the zod parse, run the social-link and region checks; `validateLocalPhone` call removed.
- `handleFinalVendorSubmit`: the vendors insert drops `location`, `about`, `price_range_text`, `phone_number`, `email`, `website_url` and all address columns, and adds `instagram_url`, `facebook_url`, `tiktok_url` — trimmed or null, prefixed with `https://` when no scheme is present (same handling the website field used). Keeps `owner_user_id`, `name`, `category`, `languages`, `image_urls`, `vendor_business_type`, `business_verification_status` and the registered-business fields.
- After the vendor row exists, insert one `vendor_service_regions` row per selected region. A failure there is logged and toasted as "Profile created, but service areas could not be saved" without failing signup.
- Unused imports/helpers left dangling by the removals (address fields, country list, phone helpers, pricing input) are cleaned up only where they become unused in this file.

## Unchanged

Registered-business toggle and verification upload, logo/showcase upload logic, `signup_source` update, step machine, `getSteps`, `backMap`, the stepper, and every planner path. No changes to `VendorProfileForm.tsx`, `VendorProfile.tsx`, `VendorServiceRegions.tsx`, or the database.
