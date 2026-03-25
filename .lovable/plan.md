

## Revised Plan: Quote Insight Feature with Direct Anthropic API

### What Changed from Previous Plan
- Edge function now calls Anthropic API directly (`https://api.anthropic.com/v1/messages`) instead of Lovable AI gateway
- Uses `claude-sonnet-4-20250514` model
- Requires new `ANTHROPIC_API_KEY` secret

### Secret Required
**ANTHROPIC_API_KEY** must be added before the edge function will work. You can get this from [console.anthropic.com](https://console.anthropic.com/) under API Keys.

### Changes

**File 1: `supabase/functions/analyse-quote/index.ts`** (new)
- Standard CORS headers + OPTIONS handler
- Parse POST body for `{ price, category, ceremonyType, vendorRating, reviewCount, isVerified, jobsCompleted, notes }`
- Call Anthropic API directly using `Deno.env.get("ANTHROPIC_API_KEY")` with the exact prompt and model specified by the user
- Parse response: extract `content[0].text`, JSON.parse it, validate sentiment enum, truncate insight to 200 chars
- On any failure: return `{ insight: "We don't have enough data...", sentiment: "neutral" }`

**File 2: `supabase/config.toml`**
- Add `[functions.analyse-quote]` with `verify_jwt = false`

**File 3: `src/components/quotes/QuoteInsight.tsx`** (new — unchanged from previous plan)
- Calls `supabase.functions.invoke('analyse-quote', { body })` on mount
- Loading: skeleton bar; Loaded: sentiment-colored card with Sparkles icon + insight text
- Error: returns null silently

**File 4: `src/pages/quotes/MyQuotes.tsx`**
- Add ceremonyType fetch via `quote.request?.event_id` → events table
- Render `<QuoteInsight>` for pending, non-expired quotes

**File 5: `src/pages/quotes/CompareQuotes.tsx`**
- Add `<QuoteInsight>` to CompareCard between price and score sections

### Implementation Order
1. Add `ANTHROPIC_API_KEY` secret (will prompt you)
2. Create edge function + update config.toml
3. Deploy and test edge function
4. Create QuoteInsight component
5. Integrate into MyQuotes and CompareQuotes

