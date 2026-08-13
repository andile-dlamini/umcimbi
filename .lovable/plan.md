# Vendor landing page at /join/vendor

Turn the partner link `/join/vendor` into a real public marketing page instead of an instant redirect to signup, while keeping partner attribution (`?ref=`) intact on every button.

## New page: src/pages/vendors/VendorLandingPage.tsx

Reads `ref` from the URL once and builds one shared signup link (`/auth?mode=signup&role=vendor` plus `&ref=<ref>` when present) used by every call to action. Sets the page title to "UMCIMBI — Join as a vendor" on mount, the same way the current landing page does.

Tracking: reuse the existing pixel helper (no changes to it). Fire `cta_im_a_vendor_clicked` on the hero "Create your free profile" and the "I'm a vendor — Register" buttons, and `cta_get_started_clicked` on the header Register button.

Sections in order:

1. Mobile-only terracotta strip above the header: "Planning a ceremony?" with an underlined link to `/onboarding`.
2. Header matching the existing landing page (transparent, turns dark with blur on scroll). Enlarged logo linking to `/onboarding`; nav with "How it Works", "FAQ", "Planning a ceremony?"; Login and Register buttons; hamburger with the same links on mobile.
3. Hero over `/images/vendors-bg.jpg` (already present) with dark overlay. Eyebrow "FOR VENDORS", heading "Join the fastest-growing traditional ceremony platform", the specified body copy, and a single "Create your free profile" button.
4. "See who is already listed" — up to 4 top-rated vendors from the existing public directory view, shown as a horizontally scrollable strip (first gallery image, logo fallback, then neutral placeholder). Cards and an outline "See the full directory" button go to `/vendors`. Whole section hidden when there are no rows.
5. "Win better. Work with less back-and-forth." — the four vendor benefit cards copied verbatim from the current landing page, followed by "I'm a vendor — Register" and the existing "Free to list your business. Approved within 48 hours." line.
6. How it works — existing `HowItWorks` component, wrapped in `id="how"`.
7. FAQ — existing FAQ items minus the isiZulu question, same dark band, `id="faq"`.
8. Footer — existing footer markup reused.

## Routing (src/App.tsx)

- Logged-out block: `/join/vendor` renders the new page instead of `VendorJoinRedirect`.
- Logged-in block: add the same `/join/vendor` route so partner links don't bounce.
- `VendorJoinRedirect` stays defined (unused) and `/join/planner` is untouched.

## Verification

Load `/join/vendor?ref=ndabe` in the preview and confirm the primary CTA points to `/auth?mode=signup&role=vendor&ref=ndabe`.

## Out of scope

No changes to auth/registration flows, quotes, bookings, payments, RLS, database functions, the public vendors list, the current landing page, sitemap or llms.txt.
