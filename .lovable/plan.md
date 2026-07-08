## Restrict vendor categories in discovery (keep existing data intact)

### 1. Database migration (additive only)
```sql
ALTER TYPE public.vendor_category ADD VALUE IF NOT EXISTS 'event_planning';
```

### 2. `src/lib/vendorCategories.ts`
- Add `'event_planning'` to `VendorCategory` type and to `VENDOR_CATEGORIES` (label: "Event Planning"), keeping alphabetical order.
- Keep `VENDOR_CATEGORIES`, `VENDOR_CATEGORY_LABELS`, `VENDOR_CATEGORY_VALUES`, `VENDOR_CATEGORY_FILTER_OPTIONS` unchanged in shape (still full list) so label lookups for legacy vendors keep working.
- Add new exports:
  - `HIDDEN_VENDOR_CATEGORIES` (cakes_baking, cleaning_services, drinks_ice_delivery, florist, invitations_stationery, livestock, makeup_beauty, transport)
  - `LIVE_VENDOR_CATEGORIES`
  - `LIVE_VENDOR_CATEGORY_VALUES`
  - `LIVE_VENDOR_CATEGORY_FILTER_OPTIONS`

### 3. Vendor signup pickers → use LIVE_ lists
- `src/pages/vendors/VendorOnboarding.tsx`: swap category select options + zod enum to `LIVE_VENDOR_CATEGORIES` / `LIVE_VENDOR_CATEGORY_VALUES`.
- `src/pages/auth/AuthPage.tsx`: same swap for the vendor category select in signup.

### 4. Discovery hooks → filter out hidden categories
- `src/hooks/useVendors.ts`: add `.not('category', 'in', '(...)')` for `HIDDEN_VENDOR_CATEGORIES` alongside existing `state_province` filter.
- `src/hooks/useVendorsWithDistance.ts`: add the same category exclusion **and** add the missing `.eq('state_province', 'KwaZulu-Natal')` for consistency with `useVendors`.

### 5. Vendors list category dropdown
- `src/pages/vendors/VendorsList.tsx`: swap filter dropdown to `LIVE_VENDOR_CATEGORY_FILTER_OPTIONS`.

### Out of scope (intentionally untouched)
- RLS policies, admin vendor management, province-restriction logic, vendors table schema (beyond the single `ALTER TYPE`).
- Label rendering paths (VendorCard, VendorProfile, VendorDetail) — continue to resolve labels for hidden categories so existing vendors still render.
