## Summary
Two targeted file changes: update image limits in the vendor gallery component, and add social link URL fields to the vendor profile edit/view page.

---

## FILE 1: src/components/vendors/VendorImageGallery.tsx

Update every hardcoded limit of `5` to `15`, and adjust derived values:

1. **Gallery slice** (line 29): `imageUrls.slice(1, 5)` → `imageUrls.slice(1, 15)`
2. **Can-add flag** (line 30): `imageUrls.length < 5` → `imageUrls.length < 15`
3. **Remaining slots** (line 93): `5 - imageUrls.length` → `15 - imageUrls.length`
4. **Toast message** (line 95): `'Maximum 5 images allowed'` → `'Maximum 15 images allowed'`
5. **Gallery label** (line 244): `'Gallery Images ({galleryImages.length}/4)'` → `'Gallery Images ({galleryImages.length}/14)'`
6. **Thumbnail grid** (line 245): `grid-cols-4` → `grid-cols-5`
7. **Help text** (line 288): `'Upload up to 5 images total.'` → `'Upload up to 15 images total.'`
8. **Add-button condition** (line 267): `galleryImages.length < 4` → `galleryImages.length < 14`

---

## FILE 2: src/pages/profile/VendorProfile.tsx

Add three optional social URL fields, wired to `editData` state and included in save/load.

### State (line 26-34)
Add to `editData` initial state:
- `instagram_url: ''`
- `tiktok_url: ''`
- `facebook_url: ''`

### Load into edit mode (line 66-74, `startEditing`)
Pull from `vendor`:
- `instagram_url: vendor.instagram_url || ''`
- `tiktok_url: vendor.tiktok_url || ''`
- `facebook_url: vendor.facebook_url || ''`

### Save payload (line 80-88, `handleSave`)
Pass to `updateVendorProfile`:
- `instagram_url: editData.instagram_url || null`
- `tiktok_url: editData.tiktok_url || null`
- `facebook_url: editData.facebook_url || null`

### Edit-mode UI
New section after the **About** textarea (since `website_url` is not in the edit form):
- Heading: "Social links (optional)"
- Three `Input` fields: Instagram URL, TikTok URL, Facebook URL, each with placeholder and wired to `editData`

### View-mode UI
New block after the existing `website_url` link (inside the contact info stack):
- Conditionally render each URL as a clickable external link with its platform label
- Only show if at least one social URL exists

---

## Out of scope
- No changes to `VendorOnboarding.tsx`
- No database migration (columns already added)
- No other files touched