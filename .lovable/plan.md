# Remove MCP Agent Integration

Tool implementations are already empty. This tears out the remaining plumbing and reverts the `next`-param auth redirects added for the OAuth consent flow.

## Changes

### 1. `vite.config.ts`
- Remove `import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";`
- Remove `mcpPlugin(),` from the plugins array.

### 2. `src/App.tsx`
- Remove `import OAuthConsent from "@/pages/OAuthConsent";`
- Remove both `<Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />` entries (logged-out + logged-in route trees).

### 3. `src/pages/auth/AuthPage.tsx`
- Revert post-login `navigate(safe)` (where `safe` derives from a `next` search param) back to `navigate('/')`.
- Revert Google `signInWithOAuth` `redirect_uri` back to `window.location.origin + '/auth/callback'` (no `?next=...`).

### 4. `src/pages/auth/AuthCallback.tsx`
- Revert the `next`-param branch to `navigate('/', { replace: true })`.

### 5. File deletions
- `src/pages/OAuthConsent.tsx`
- `supabase/functions/mcp/index.ts`
- `src/lib/mcp/` (entire directory: `index.ts` and `tools/`)
- `.lovable/mcp/manifest.json`

### 6. Dependency
- Remove `@lovable.dev/mcp-js` from `package.json` and refresh `bun.lock` (`bun remove @lovable.dev/mcp-js`).

## Out of scope
No other routes, auth logic, RLS, or unrelated files touched. No edge function redeploy needed beyond removing the `mcp` function source (it will simply stop being regenerated).

## Verification
- `bun tsgo` clean.
- App builds with Vite (no missing plugin import).
- `/auth` login lands on `/`; Google OAuth callback lands on `/`.
