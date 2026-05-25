Add simple pagination to VendorsList.tsx to show 10 vendors at a time.

Changes:
1. Add `page` state and `PAGE_SIZE = 10` constant after existing state declarations.
2. Add `useEffect` to reset `page` to 1 whenever `search`, `category`, `locationFilter`, `verifiedOnly`, or `superVendorsOnly` changes.
3. Derive `paginatedVendors` and `hasMore` by slicing the `vendors` array.
4. Render `paginatedVendors` instead of `vendors` in the `.map()`.
5. Add a "Load more" button after the vendor cards that increments the page when clicked.
6. Update the results count text from "X vendors found" to "Showing Y of X vendors".

No other logic changes.