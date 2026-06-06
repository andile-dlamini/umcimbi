## Goal
Apply two focused changes to `src/pages/vendors/VendorOnboarding.tsx` only.

### CHANGE 1 — Raise showcase image cap from 5 to 15
Four exact replacements:
1. `const remaining = 5 - showcaseFiles.length;` → `const remaining = 15 - showcaseFiles.length;`
2. `toast.error('Maximum 5 showcase images allowed');` → `toast.error('Maximum 15 showcase images allowed');`
3. `<Label>Showcase your work (up to 5 images)</Label>` → `<Label>Showcase your work (up to 15 images)</Label>`
4. `{showcaseFiles.length < 5 && (` → `{showcaseFiles.length < 15 && (`

### CHANGE 2 — Add Instagram, TikTok, Facebook URL fields
1. **Zod schema** (`vendorSchema`): append three optional fields after `website_url`:
   - `instagram_url`, `tiktok_url`, `facebook_url` — each `z.string().trim().max(500).optional().or(z.literal(''))`
2. **formData state**: add `instagram_url: ''`, `tiktok_url: ''`, `facebook_url: ''` after `website_url`
3. **Submit payload**: add `instagram_url`, `tiktok_url`, `facebook_url` to `createVendorProfile()` call, each as `formData.<field>.trim() || null`
4. **UI fields**: insert immediately after the existing Website input block. Three optional fields following the same Label + Input pattern:
   - **Instagram** — placeholder `https://instagram.com/yourbusiness`, Camera icon (already imported)
   - **TikTok** — placeholder `https://tiktok.com/@yourbusiness`
   - **Facebook** — placeholder `https://facebook.com/yourbusiness`

### Notes
- Only `src/pages/vendors/VendorOnboarding.tsx` is modified.
- No database migration needed — columns already exist.
- No other files touched.