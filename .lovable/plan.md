## Add Meta Pixel (ID 2874719596196769)

### 1. Base pixel in `index.html`
- Insert the standard Meta Pixel `<script>` block in `<head>` (after the existing SEO/JSON-LD tags).
- The `<noscript><img/></noscript>` fallback goes at the top of `<body>` (not `<head>` — `<noscript>` in `<head>` may only contain metadata tags, so putting the pixel image there is invalid HTML5).

### 2. Route-change PageView
- New file `src/hooks/useMetaPixelPageView.ts`: uses `useLocation()` from react-router-dom, and on `location.pathname` change (skipping the very first render, since the base code already fires one PageView) calls `window.fbq('track', 'PageView')` guarded by `typeof window.fbq === 'function'`.
- Declare `fbq` on the `Window` interface (inside the hook file) for TypeScript.
- Call the hook inside `AppRoutes` in `src/App.tsx` — it sits within `<BrowserRouter>`, so router context is available.

Nothing else changes; no custom conversion events.
