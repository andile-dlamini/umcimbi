# Landing page entry points + public vendor list filtering

Two files change: `src/pages/onboarding/OnboardingLanguage.tsx` and `src/pages/vendors/PublicVendorsList.tsx`.

## Part A — Landing page

### Header
- Logo `h-16` becomes `h-20` on mobile, `h-24` from `sm` up, `w-auto` kept.
- Desktop nav: "How it Works" (scrolls to `how`), "Organisers" (Link to `/vendors`), "Vendors" (Link to `/join/vendor`), "FAQ" (scrolls to `faq`).
- Nav styling: `text-[15px] font-semibold text-white/90` with a hover state.
- "Become a Vendor" button added immediately left of Login, `hidden sm:inline-flex`, ghost/outline variant, links to `/join/vendor`.
- Mobile drawer mirrors the same four entries with links for Organisers and Vendors; drawer closes on any click.

### Mobile utility strip
- Rendered as the top row *inside* the existing fixed header (`md:hidden`), so it stays pinned with the header and no gap appears on scroll. No change to header top offset or hero padding.
- Terracotta background, centred small white text: "Are you a vendor?" plus an underlined "Become a Vendor" link with a small right arrow to `/join/vendor`.

### Hero fork
- Organiser block unchanged (`scrollTo('organisers')`).
- Vendor block navigates to `/join/vendor` instead of scrolling.

### Organisers section (id="organisers")
Section element, id, background image and dark overlay stay. Contents replaced with:
- Eyebrow "FOR ORGANISERS" (existing styling).
- Heading "Your traditional ceremony planning starts here".
- Body "Find vetted vendors, ask for quotations, compare quotations, book and pay online."
- White search card: category select from `LIVE_VENDOR_CATEGORY_FILTER_OPTIONS` (placeholder "Categories"), a real empty text input for location with placeholder "Durban", and a Search button. Submit navigates to `/vendors`, adding `category` when not "all" and `location` when non-empty (e.g. `/vendors?category=catering&location=durban`).
- Heading "Explore vendors by category".
- 9 circular category buttons from `LIVE_VENDOR_CATEGORIES` excluding `other`; 3 per row on mobile, one row of 9 from `lg` up. Translucent white circle, light border, gold icon, label beneath. Each navigates to `/vendors?category=<value>`. `other` stays in the select dropdown.
- Existing "Free to join. Takes less than a minute." line kept at the bottom.
- The three feature cards and both "Register to start planning" buttons removed.

### Vendors section
- The whole `id="vendors"` section (copy, benefit cards, dashboard/orders mockups) is deleted; imports only it used are removed, imports still used stay.

## Part B — Public vendors list

- On mount, read `category` and `location` via `useSearchParams`. Category seeds local state only when it matches `LIVE_VENDOR_CATEGORY_VALUES`, otherwise `'all'`; location seeds the location input when present. After mount, behaviour stays local state — no writing back to the URL.
- Add a location filter in local state, applied to the `vendors_directory_public` query with `.ilike('location', '%value%')` only when non-empty, matching `useVendors.ts`.
- Location input uses the same MapPin icon and styling as `VendorsList.tsx`, placeholder "Filter by location...".
- No verified/super-vendor toggles, no distance or geocoding. Ordering, `handleCardClick` and its redirect are untouched.

## Verification
- Grep confirms no `scrollTo('vendors')` remains.
- Typecheck and build clean, no unused imports.
- Browser check: `/vendors?category=catering` and `/vendors?location=durban` land pre-filtered; the utility strip stays pinned with the header while scrolling the landing page.
