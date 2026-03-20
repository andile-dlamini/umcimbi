

## Fix: Show Vendor Logo on Vendor List Cards

### Problem
`VendorCard` still displays the first showcase image (`image_urls[0]`) as the thumbnail instead of the vendor's logo/avatar.

### Change

**`src/components/shared/VendorCard.tsx`** — two edits:

1. **Line 40**: Change `rounded-lg` to `rounded-full` (avatar style for logo)
2. **Line 42**: Change image source from:
   ```tsx
   src={vendor.image_urls?.[0] || '/placeholder.svg'}
   ```
   to:
   ```tsx
   src={vendor.logo_url || vendor.image_urls?.[0] || '/placeholder.svg'}
   ```

This prioritizes `logo_url`, falls back to the first gallery image, then to placeholder. One file, two lines.

