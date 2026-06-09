## Plan: Social URL UX improvements in VendorProfile

### Goal
Improve the social-media editing experience in `VendorProfile.tsx` so vendors type plain usernames instead of full URLs, while the database continues to store canonical URLs.

### Changes

#### 1. Add two helper functions before `VendorProfile`
- `toSocialUrl(platform, handle)` — converts a raw handle into a canonical URL. Strips leading `@`; passes through if already a URL; otherwise prepends the correct base domain.
- `toHandle(url)` — strips the base domain from a stored URL so the input field shows only the username/handle.

#### 2. Strip base URLs when loading existing data
In `startEditing`, replace the three social assignments with `toHandle(...)` so the edit form pre-fills with bare usernames rather than full URLs.

#### 3. Update save payload, labels and placeholders
In `handleSave`, wrap `editData.instagram_url`, `tiktok_url`, and `facebook_url` with `toSocialUrl(...)` before sending to the API.

In the JSX editing block, update:
- Instagram label from "Instagram URL" → "Instagram username"
- TikTok label from "TikTok URL" → "TikTok username"
- Facebook label from "Facebook URL" → "Facebook username or page name"
- All three placeholders from full URLs → "e.g. maswazicatering"

### Scope
- **Only file changed:** `src/pages/profile/VendorProfile.tsx`
- **No backend changes required.**