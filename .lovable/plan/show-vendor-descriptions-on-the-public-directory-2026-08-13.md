# Show vendor descriptions on the public directory

## What changes

1. **Database view** — the public directory view currently exposes only card-level fields (name, category, location, photos, rating, badges). Add the vendor's `about` text so public cards can show a short description. Nothing else is added: no pricing, no contact details, no verification internals.

2. **Vendor card** — under the name and metadata, show the vendor's own `about` text exactly as stored, clamped to three lines. Vendors with no description render nothing extra and leave no gap.

3. **Category deep links** — already in place: `/vendors?category=catering` seeds the category filter on mount when the value is a live category, otherwise falls back to "All". No further work needed; verification only.

## Technical detail

- New migration in `supabase/migrations`: `CREATE OR REPLACE VIEW public.vendors_directory_public WITH (security_invoker = off)` selecting the existing 13 columns in the same order with `about` appended last, same `WHERE is_active = true AND public.is_province_live(state_province)`, followed by `GRANT SELECT ... TO anon, authenticated`. No RLS, function, trigger or cron changes.
- `src/components/shared/VendorCard.tsx`: render `{vendor.about && <p className="text-sm text-muted-foreground mt-1.5 line-clamp-3">{vendor.about}</p>}`. `line-clamp-3` is available via Tailwind. This card is also used by the authenticated vendors list, where `about` is already present, so descriptions appear there too.
- No text is summarised or generated.

## Out of scope

Auth/OTP/password flows, quote/booking/payment/payout code, `handleCardClick` and its redirect, the onboarding page and vendor landing page, vendor onboarding and profile editor.

## Verification

Query the view as the anonymous role to confirm rows still return and `about` is present, then load `/vendors` (including `?category=`) and check a vendor with a null `about` renders with no gap.
