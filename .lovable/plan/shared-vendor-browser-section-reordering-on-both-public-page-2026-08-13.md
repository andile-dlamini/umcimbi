# Shared vendor browser + section reordering on both public pages

## What changes

1. The vendor browsing experience (search, category circles, results grid) becomes one shared component used by both the main landing page and the vendor landing page.
2. The landing page leads with the organiser vendor browser instead of burying it below "How UMCIMBI works".
3. The vendor page drops the "Win better. Work with less back-and-forth." benefits block and shows the same tiled vendor browser (no search card) instead of the carousel, with tiles going to vendor signup.

## New component: `src/components/vendors/VendorBrowser.tsx`

Extracted verbatim from the organisers section of `OnboardingLanguage.tsx`, keeping every current behaviour:

- Query on `vendors_directory_public` selecting `id,name,category,location,logo_url,image_urls,about`.
- Explicit 60-row slice with its scale comment, Fisher-Yates shuffle run once inside the effect and stored in state (never during render), then sliced to `resultCount`.
- `.ilike` partial location match, `eq` category match.
- Loading spinner, empty state with clear-filter action, active-filter indicator with clear control.
- Render order: results grid, "Explore vendors by category" heading, category circles. A circle filters in place, does not navigate, and scrolls `#vendor-results` into view.

Props:

| Prop | Type | Behaviour |
| --- | --- | --- |
| `showSearchCard` | boolean | Renders the white search card (category select, location input, Search button). When false, no search card and no location filtering at all. |
| `resultCount` | number | Number of tiles shown. |
| `onVendorClick` | `(vendorId: string) => void` | Tile click handler. |
| `syncUrl` | boolean (optional) | When true, active filter is written to and read from the page URL. When false/omitted, filter state is local only. |

Styling note: the markup is white-on-dark as it is today, so it stays inside a dark section on both pages.

## `src/pages/onboarding/OnboardingLanguage.tsx`

- Replace the inline browsing implementation with `<VendorBrowser showSearchCard resultCount={8} syncUrl onVendorClick={...} />`. Click behaviour unchanged: `/auth?mode=signup&role=planner&redirect=<encoded /vendors/:id>`.
- Reorder sections to: hero, organisers (`#organisers`), How UMCIMBI works (`#how`), FAQ (`#faq`), footer. The whole organisers `<section>` moves as-is, including its id, background image and dark overlay. All ids stay intact so nav scroll targets keep working.
- Unused imports (Select, Input, Search, category icons, VendorTile, supabase, etc.) are removed once the logic moves out.

## `src/pages/vendors/VendorLandingPage.tsx`

- Delete the entire "Win better. Work with less back-and-forth." section: the four benefit cards, the "I'm a vendor — Register" button and the "Free to list your business. Approved within 48 hours." line (and the now-unused `VENDOR_BENEFITS` constant and its icon imports).
- In "See who is already listed": keep the heading and sub copy, replace `VendorCarousel` with `<VendorBrowser showSearchCard={false} resultCount={8} onVendorClick={...} />` (no `syncUrl`). Tiles navigate to `/auth?mode=signup&role=vendor&redirect=<encoded /vendors/:id>`, preserving the `ref` query param the same way the existing `signupHref` does. This section becomes a dark band so the browser markup reads correctly.
- "See the full directory" button now targets the organisers section of the landing page instead of `/vendors`, since that route redirects. Confirmed in `src/App.tsx`: for logged-out visitors `/` falls through to a `<Navigate to="/onboarding" replace />` catch-all, which drops the hash — so the button links directly to `/onboarding#organisers`.
- Because React Router does not scroll to a hash on its own, `OnboardingLanguage` gets a small mount effect that scrolls the element matching `location.hash` into view (guarded so it only runs when a hash is present), so the button lands on the organisers section rather than the top of the page. Verified in the browser after the change.
- Reorder sections to: hero, See who is already listed, How UMCIMBI works, FAQ, footer.
- `src/components/vendors/VendorCarousel.tsx` stays on disk, unreferenced.

## Not touched

AuthPage, VendorDetail and the `/vendors/:id` route, quotes/bookings/payments/Ozow, any RLS policy, function, view or migration, VendorsList, useVendors, useVendorsWithDistance, VendorCard, VendorTile, the `/vendors` redirect in App.tsx. Hero, header, mobile strip, How UMCIMBI works content, FAQ content and footer contents stay identical — only their order changes.

## Verification

Browser check on both pages: section order, no "Win better" block, vendor page browser has no search card or location filter, tile clicks land on `/auth`, and filter state appears in the URL on the landing page but not on the vendor page.
