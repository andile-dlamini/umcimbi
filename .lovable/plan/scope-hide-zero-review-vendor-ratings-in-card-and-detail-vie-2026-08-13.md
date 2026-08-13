Scope: hide zero-review vendor ratings in card and detail views, and sort vendor lists by review count instead of rating so unrated vendors do not float to the top.

What will change

1. `src/components/shared/VendorCard.tsx`
   - Wrap the rating block (Star icon + numeric rating + review count) in a condition.
   - Render only when `vendor.review_count > 0 && vendor.rating != null`.
   - When hidden, render nothing in its place; the location block continues to render normally.
   - This change applies to both `PublicVendorsList.tsx` and `VendorsList.tsx` because they share this component.

2. `src/pages/vendors/VendorDetail.tsx`
   - Wrap the detail-page rating block (Star icon + numeric rating + "reviews" label) in the same condition.
   - Render only when `vendor.review_count > 0 && vendor.rating != null`.
   - When hidden, render nothing in that spot.

3. `src/pages/vendors/VendorLandingPage.tsx`
   - Replace the `vendors_directory_public` query ordering:
     - `.order('is_super_vendor', { ascending: false, nullsFirst: false })`
     - `.order('review_count', { ascending: false, nullsFirst: false })`
   - Remove the existing `.order('rating', { ascending: false })`.

4. `src/pages/vendors/PublicVendorsList.tsx`
   - Update the `vendors_directory_public` query ordering:
     - Add `nullsFirst: false` to the existing `is_super_vendor` order.
     - Replace `.order('rating', { ascending: false })` with `.order('review_count', { ascending: false, nullsFirst: false })`.

5. `src/hooks/useVendors.ts`
   - Replace `.order('rating', { ascending: false })` with `.order('review_count', { ascending: false, nullsFirst: false })`.
   - Remove the rating ordering from this query.

6. `src/hooks/useVendorsWithDistance.ts`
   - In the `rating` sort case, change the comparator to compare `review_count` descending first (treating null as 0).
   - Only fall back to comparing `rating` descending when review counts are equal.
   - Keep the existing verified badge boost that runs before the switch.
   - Leave the `distance` and `name` cases unchanged.
   - Do not change the `SortOption` type, the default `sortBy` value, or the sort dropdown labels in `VendorsList.tsx`. The option remains called "rating"; only its comparator changes.

What will not change

- `src/components/vendors/VendorRating.tsx` and the review submission flow.
- `rating` and `review_count` columns, any database view, RLS policy or migration.
- Auth, registration, OTP, quotes, bookings, payments, payouts or Ozow code.
- The sort dropdown in `VendorsList.tsx`.
- `src/pages/onboarding/OnboardingLanguage.tsx`.

Verification

- Confirm a vendor with `review_count === 0` shows no star and no rating number anywhere.
- Confirm a vendor with at least one review still shows the star, rating value and review count normally.
- Confirm the vendor list queries and client-side sort still return reviewed vendors above unreviewed ones.

