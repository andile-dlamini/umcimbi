Make two surgical changes, touching only the two files specified.

**File 1 — src/pages/vendors/VendorDetail.tsx**
- CHANGE 1a: Build gallery images from `image_urls.slice(1)` instead of the full array. The logo (index 0) is removed from the gallery. Introduce `logoUrl` from index 0.
- CHANGE 1b: In the vendor info block (the div with `px-3 py-3.5`), add a small circular logo avatar immediately before the `<h1>` vendor name. Uses the `logoUrl` extracted above; falls back to a letter avatar using the first character of the vendor name.

**File 2 — src/components/shared/VendorCard.tsx**
- Replace the `placeholder.svg` fallback inside the circular vendor image with a letter avatar. If `logo_url` or `image_urls[0]` exists, show the image; otherwise render a primary-coloured circle with the first letter of the vendor name.

No other files touched. No migration needed.