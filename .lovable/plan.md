

## Three Changes

### 1. Remove WhatsApp Button from VendorDetail

**`src/pages/vendors/VendorDetail.tsx`**
- Delete `whatsappLink` variable (lines 86-88)
- Delete WhatsApp button block (lines 246-256)
- Remove `MessageCircle` from imports (line 5)
- Keep Call button and wrapping div as-is

### 2. Add Google OAuth to AuthPage

**`src/pages/auth/AuthPage.tsx`**
- Uses Lovable Cloud managed Google OAuth via `lovable.auth.signInWithOAuth("google")`
- Add a "Continue with Google" button at the top of the login card, before phone input
- Add an "or" divider between Google button and phone login
- On success, existing `onAuthStateChange` in AuthContext handles session and routing
- Add `/~oauth` to service worker denylist (relevant for PWA change below)

**Note**: This requires using the Configure Social Login tool to generate the lovable module first.

### 3. Add PWA Support

**New files:**
- `public/manifest.json` — app manifest with name, colors, icons
- `src/components/shared/InstallPrompt.tsx` — dismissable bottom banner for mobile install prompt

**Modified files:**
- `index.html` — add manifest link, theme-color, apple-mobile-web-app meta tags
- `vite.config.ts` — add `vite-plugin-pwa` with cache-first for static assets, network-first for API, `navigateFallbackDenylist: [/^\/~oauth/]`
- `src/components/layout/AppShell.tsx` — render `<InstallPrompt />` for authenticated users
- `package.json` — add `vite-plugin-pwa` dependency

**InstallPrompt behavior:**
- Captures `beforeinstallprompt` event
- Shows only on mobile, once per session (sessionStorage flag)
- Dismissable banner at bottom with "Install" button

