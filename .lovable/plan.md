# Plan: Three small fixes for feedback, vendor search, and zero-results UI

## 1. Fix `send-feedback` typeLabel crash

File: `supabase/functions/send-feedback/index.ts`

- Add `'unmet_demand': 'Unmet demand'` to the `typeLabel` lookup map on line 124.
- Change the lookup so it falls back to the raw `feedbackType` string when a key is missing, preventing future unknown types from crashing the function.
- Change nothing else in this file.

## 2. Make vendor search match each word independently

Files: `src/hooks/useVendors.ts` and `src/hooks/useVendorsWithDistance.ts`

- Keep the existing `sanitizeVendorSearchTerm` helper that strips `, ( ) " \` and collapses whitespace.
- After sanitising, split the term on whitespace into individual words, discard empty strings, and cap at 5 words.
- Build the `.or()` filter so each word is matched against both `name` and `about`.
  - Example: "masodi, odempho" becomes `name.ilike.%masodi%,about.ilike.%masodi%,name.ilike.%odempho%,about.ilike.%odempho%`.
- If no words remain after sanitising, skip the search filter entirely.
- Apply the identical implementation in both files.

## 3. Restore "No vendors found" heading and add a clear-filters button

File: `src/pages/vendors/VendorsList.tsx`

- Keep the existing unmet-demand form, heading copy, inputs, Send button, validation, and submit handler exactly as they are.
- Add a short "No vendors found" heading above the form inside the zero-results block.
- Below the form, add a "Clear all filters" button that resets `search`, `category`, `locationFilter`, `verifiedOnly`, and `superVendorsOnly` to their defaults.
- Do not change the `trackEvent` useEffect, filters, pagination, or "Show more vendors" logic.

## What we will not change

- No database migration is needed.
- No other files will be touched.
