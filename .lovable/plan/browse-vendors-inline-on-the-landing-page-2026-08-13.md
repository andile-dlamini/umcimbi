# Browse vendors inline on the landing page

Vendor browsing moves onto the landing page itself, and the vendor strip on the vendor landing page becomes a real carousel. Both pages share one vendor tile component.

## New shared components

**VendorTile** — the tile currently written inline on the vendor landing page, lifted out unchanged: rounded card, image area with a letter fallback when there is no photo, name, then category and location on one line. Two additions: an optional `about` line below (clamped to two lines, nothing rendered when empty) and an `onClick` handler.

**VendorCarousel** — a horizontal row of tiles with left and right arrows. Arrows appear from md upward only; on mobile the row stays swipeable with no arrows. Each arrow scrolls about one tile width. Arrows disable at the start and end, and sit clear of the tiles so nothing becomes unclickable. When the visitor has reduced motion enabled, scrolling jumps instead of animating.

## Vendor landing page (/join/vendor)

- Inline tiles replaced by VendorTile inside VendorCarousel.
- Query pulls 10 vendors instead of 4, in random order so the same faces do not appear on every load. Same columns as today (no about — tiles here stay compact). The section still hides completely when nothing comes back.
- Tiles and the "See the full directory" button now go to `/`, where browsing happens.

## Landing page organisers section

A results area is inserted between the white search card and the "Explore vendors by category" heading. Section order: eyebrow, heading, body copy, search card, results, category heading, category circles, "Free to join" line.

Results render as a responsive grid of tiles — 2 per row on mobile, 3 from sm, 4 from lg — each showing the vendor's two-line description.

- Default state: up to 8 vendors in random order, so the area is never empty.
- Clicking a category circle filters in place with no navigation, and scrolls the results into view.
- The Search button applies the chosen category and the location text together.
- Location matches partially, the same way the logged-in vendor search does.
- Loading state while fetching; a short empty state with a clear-filter action when a filter returns nothing.
- The active filter is shown with a control to clear it and return to the random default.

Filters are written into the URL (`/?category=catering&location=durban`) using replace, so the back button does not fill with filter steps, and are read back on load so shared links work.

Three links that pointed at `/vendors` change: the desktop nav "Organisers" item and its mobile drawer twin become scrolls to the organisers section (the drawer closes), and the category circles filter in place.

## Routing

For logged out visitors, `/vendors` redirects to `/` carrying any category and location params through, so `/vendors?category=catering` lands on `/?category=catering` with the filter already applied. The route is redirected rather than removed so bookmarks and indexed links keep working. PublicVendorsList stays in the codebase, unreferenced. The authenticated `/vendors` route is untouched.

## Technical notes

- Random ordering: PostgREST cannot order randomly, so each query fetches an explicit slice of 60 rows and shuffles client side before slicing to the display count. The shuffle runs once when the result arrives and the shuffled array is held in state — never computed during render — so tiles do not jump while the visitor types in the location input. This applies to both the vendor landing carousel and the landing page results grid. A code comment notes that once the active vendor count approaches 60 this needs revisiting, since beyond that the shuffle only reorders the same fixed subset.
- Landing page tile clicks reuse the existing behaviour from PublicVendorsList unchanged: navigate to `/auth?mode=signup&role=planner` with a `redirect` param encoding `/vendors/<vendorId>`.

- Landing page results select `id, name, category, location, logo_url, image_urls, about` from `vendors_directory_public`; the vendor landing carousel keeps the existing column list.
- URL state uses `useSearchParams` with `{ replace: true }`.
- Carousel scroll uses a ref on the scroll container with `scrollBy`, `behavior` chosen from a `prefers-reduced-motion` media query, and a scroll listener to compute the disabled arrow states.
- Files touched: new `src/components/vendors/VendorTile.tsx` and `src/components/vendors/VendorCarousel.tsx`; edits to `src/pages/vendors/VendorLandingPage.tsx`, `src/pages/onboarding/OnboardingLanguage.tsx`, `src/App.tsx`.

## Out of scope

No public vendor detail page, no change to what logged out visitors see on a profile, no analytics, no sitemap or llms.txt changes, no database, RLS or view changes, no auth, quote, booking or payment changes.
