# Multiple categories per vendor

A vendor keeps one primary category (drives pricing and identity) and can add any number of additional categories that affect discoverability and display only.

## 1. Database migration

New migration in `supabase/migrations` adding to `public.vendors`:

- `additional_categories vendor_category[] NOT NULL DEFAULT '{}'`
- GIN index on the column for fast containment queries
- CHECK constraint: `NOT (category = ANY(additional_categories))`

Both views are recreated with `additional_categories` appended as the LAST column, everything else unchanged:

- `public.vendors_directory_public` — keeps `security_invoker = off`, its `is_active = true AND public.is_province_live(state_province)` filter, and `GRANT SELECT TO anon, authenticated`.
- `public.vendors_marketplace` — keeps `security_invoker = off`, the same filter, `REVOKE ALL FROM anon`, `GRANT SELECT TO authenticated`, and its comment (updated to mention the new column).

No RLS policy, function, trigger, or enum change.

## 2. Filtering matches primary OR additional

Server-side queries switch to a combined filter (equality on `category` OR containment on `additional_categories`), verified against real rows before finishing:

- `src/components/vendors/VendorBrowser.tsx`
- `src/hooks/useVendors.ts`
- `src/hooks/useVendorsWithDistance.ts`

Client-side comparisons check primary or membership in the array:

- `src/pages/vendors/PublicVendorsList.tsx`
- `src/pages/events/tabs/BookVendorsTab.tsx` (both booking and request comparisons; the vendor selects will include the new column)

`HIDDEN_VENDOR_CATEGORIES` exclusions stay on the primary category, unchanged.

## 3. Display all categories

One line, primary first, joined by a middle dot, each label through `getVendorCategoryLabel`, truncating rather than wrapping; more than two categories renders the first two plus a "+N more" indicator:

- `src/components/vendors/VendorTile.tsx` (category · location line)
- `src/components/shared/VendorCard.tsx`
- `src/pages/vendors/VendorDetail.tsx`

`AdminQuotations.tsx` keeps showing the primary category only.

## 4. Editing

`src/components/vendors/VendorProfileForm.tsx` gains an "Additional services" multi-select beneath the primary category selector:

- Options from `LIVE_VENDOR_CATEGORIES`, excluding `other` and the currently selected primary.
- Changing the primary to a value already in additional removes it from additional, so the CHECK constraint can never be violated.
- Helper text: pricing is set for the primary category only.

Not added to the signup flow in `AuthPage.tsx`.

## 5. Pricing unchanged

`src/lib/pricingModels.ts`, `PricingInput.tsx`, and how `price_range_text` is set stay exactly as they are, keyed to the primary category.

## Verification

- Migration applied; both views expose `additional_categories` last.
- A category filter returns vendors holding it as primary and as additional (tested against real data, including the PostgREST array containment syntax).
- A two-category vendor shows both on tile, card, and detail page.
- The CHECK constraint rejects putting the primary into additional.
- Pricing behaviour unchanged.

## Technical notes

Containment inside `or()` uses `additional_categories.cs.{value}` alongside `category.eq.value`; this will be run against the live view first, since a malformed array operator silently returns no rows.
