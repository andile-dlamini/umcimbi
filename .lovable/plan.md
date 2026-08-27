# Plan: Unhide livestock category and fix vendor search sanitisation

## What we will change

1. **Unhide the livestock category**
   - File: `src/lib/vendorCategories.ts`
   - Remove `'livestock'` from the `HIDDEN_VENDOR_CATEGORIES` array.
   - Do not touch the array comment or any other category.

2. **Sanitise vendor search input against PostgREST syntax errors**
   - Files: `src/hooks/useVendors.ts` and `src/hooks/useVendorsWithDistance.ts`
   - Before interpolating `filters.search` into the `.or(`name.ilike.%...%,about.ilike.%...%`)` call, sanitise the string:
     - Strip the characters `,`, `(`, `)`, `"`, and `\`.
     - Replace each stripped character with a space.
     - Collapse repeated whitespace and trim.
     - If the result is empty, skip the search filter entirely.
   - Apply the identical logic in both files so they stay in sync.

## What we will not change

- The category `.or()` filter.
- The `.ilike('location', ...)` filter.
- The `state_province = 'KwaZulu-Natal'` filter.
- The `HIDDEN_VENDOR_CATEGORIES` `.not()` filter.
- Ordering, pagination, or `trackEvent` logic in `src/pages/vendors/VendorsList.tsx`.
- Any other file.
