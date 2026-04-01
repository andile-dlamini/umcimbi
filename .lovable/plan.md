

## Plan: Add Two Vendor Categories and Rename One

### Summary
Add `dj_sound_audio` and `florist` to the vendor category enum and code definitions, and rename the label for `invitations_stationery`.

### Changes

**1. Database migration** — Add two new enum values to `vendor_category`:
```sql
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'dj_sound_audio';
ALTER TYPE vendor_category ADD VALUE IF NOT EXISTS 'florist';
```

**2. `src/lib/vendorCategories.ts`** — Three changes:
- Add `'dj_sound_audio'` and `'florist'` to the `VendorCategory` type union
- Add entries to `VENDOR_CATEGORIES` array after `decor`: `{ value: 'dj_sound_audio', label: 'DJ / Sound & Audio' }` then `{ value: 'florist', label: 'Florist' }`
- Rename `invitations_stationery` label to `'Invitations, Stationery & Printing'`

**3. `src/types/database.ts`** — Add `'dj_sound_audio' | 'florist'` to the `VendorCategory` type union (line 5)

**4. `src/data/vendors.ts`** — The legacy `vendorCategories` array: no structural change needed (it's a subset used for sample data filtering)

### Files touched
- New migration SQL file
- `src/lib/vendorCategories.ts`
- `src/types/database.ts`

### Not changed
- No existing category IDs modified
- No vendor data or bookings affected
- No pages changed

