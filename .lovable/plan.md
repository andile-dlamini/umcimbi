# Landing page: vendor + organiser entry points

Only `src/pages/onboarding/OnboardingLanguage.tsx` changes. No backend, no auth, no other pages.

## Header
- Logo grows from `h-16` to `h-20` on mobile, `h-24` from `sm` up (`w-auto` kept).
- Desktop nav becomes: "How it Works" (scrolls to `how`), "Organisers" (Link to `/vendors`), "Vendors" (Link to `/join/vendor`), "FAQ" (scrolls to `faq`).
- Nav styling upgraded from `text-[13px] text-white/60` to `text-[15px] font-semibold text-white/90` with a hover state.
- New "Become a Vendor" button added left of Login, `hidden sm:inline-flex`, ghost/outline variant, links to `/join/vendor`.
- Mobile drawer gets the same four entries, with Organisers and Vendors as links (menu closes on click).

## Mobile utility strip
- Thin terracotta strip above the header, `md:hidden`, centred white small text: "Are you a vendor?" plus underlined "Become a Vendor →" link to `/join/vendor`.
- Strip scrolls with the page; the fixed header's top offset is shifted down on mobile so the two never overlap, and hero top padding is adjusted to match.

## Hero fork
- First block (organising a ceremony) unchanged.
- Second block (providing vendor services) navigates to `/join/vendor` instead of scrolling.

## Organisers section (id="organisers")
Section shell, background image and dark overlay stay. Inside is replaced with:
- Eyebrow "FOR ORGANISERS" (existing styling).
- Heading "Your traditional ceremony planning starts here".
- Body "Find vetted vendors, ask for quotations, compare quotations, book and pay online."
- White search card: category select from `LIVE_VENDOR_CATEGORY_FILTER_OPTIONS` (placeholder "Categories"), location field showing "Durban", Search button. Submit navigates to `/vendors`, appending `?category=<value>` when not "all".
- Heading "Explore vendors by category".
- Circular category buttons for every `LIVE_VENDOR_CATEGORIES` entry (10 live categories), 3 per row on mobile, single row from `lg` up. Translucent white circle, light border, gold icon, label under. Each navigates to `/vendors?category=<value>`.
- Existing line "Free to join. Takes less than a minute." kept at the bottom.
- The three feature cards and both "Register to start planning" buttons are removed.

## Vendors section
- The entire `id="vendors"` section (copy, benefit list, dashboard/orders mockups) is deleted; that content lives on `/join/vendor`.

## Technical notes
- New imports: `useNavigate` from react-router-dom, `LIVE_VENDOR_CATEGORIES` / `LIVE_VENDOR_CATEGORY_FILTER_OPTIONS` from `@/lib/vendorCategories`, a small icon map from lucide-react, and Select/Input from the shadcn UI set.
- Icons only used by the deleted vendors section (e.g. `Users`, `Zap`, and any others left unreferenced) are dropped from the import list; anything still used elsewhere stays.
- Verification: grep confirms no `scrollTo('vendors')` remains, then typecheck and build.
