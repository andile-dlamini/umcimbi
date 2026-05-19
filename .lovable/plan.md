# SEO + AI Search Review for umcimbi.co.za

A four-phase sweep: automated scan + fixes, Google Search Console setup, Semrush-powered research, then a single prioritised action list.

## Phase 1 — Run the SEO/AI review and apply fixes

1. Trigger a fresh SEO scan on the current project (`seo_chat--trigger_scan`).
2. Once results are in, list all findings (`seo_chat--list_findings`).
3. For every high-impact failing finding that is safe to auto-fix in code (meta titles/descriptions, canonical tags, `lang`, single H1, alt text, JSON-LD, OpenGraph/Twitter card hygiene, robots/sitemap presence, viewport, etc.), apply the fix directly in the codebase and mark the finding fixed.
4. Re-check sitemap + robots:
   - Ensure `public/sitemap.xml` (or generator) lists all public routes with `https://www.umcimbi.co.za` as the base.
   - Ensure `public/robots.txt` references the sitemap.

Anything that requires a judgment call (e.g. rewriting hero copy) is deferred to Phase 4 recommendations, not auto-applied.

## Phase 2 — Google Search Console

1. Connect the Google Search Console connector (`standard_connectors--connect` with `google_search_console`).
2. Request a META verification token for `https://www.umcimbi.co.za/`.
3. Inject the `<meta name="google-site-verification" ...>` tag into `index.html` `<head>`. **This requires the user to click Publish/Update so the meta tag is live on the custom domain before verification can succeed.**
4. After publish, call the verification endpoint, then add the site to Search Console.
5. Submit the sitemap (`https://www.umcimbi.co.za/sitemap.xml`) via the Search Console API.

If the connector isn't authorised or the user hasn't published yet, I'll pause at the relevant step and flag it.

## Phase 3 — Semrush research (database: `za`)

All queries scoped to South Africa. One tool call per question:

| Question | Tool |
|---|---|
| a. Keywords to target (ceremonies + vendors, SA) | `keyword_research` on seed terms: "umembeso", "lobola", "umabo", "umemulo", "imbeleko", "traditional wedding vendors south africa", "lobola negotiation" |
| b. Competitors ranking for similar | `competitive_analysis` on `umcimbi.co.za` (za database) |
| c. Why homepage isn't ranking | `domain_analysis` + `page_analysis` on `https://www.umcimbi.co.za/` |
| d. Pages that drive traffic for sites like this | `top_pages` on the 2–3 strongest competitors identified in (b) |
| e. Backlinks to target | `backlink_analysis` on top SA competitors → extract referring domains in cultural/wedding/events space |
| f. Landing page copy improvements | Combine keyword findings from (a) with current homepage copy audit |

## Phase 4 — Prioritised action list

Deliver a single ranked list, grouped:

- **Quick wins (this week)** — auto-fixes applied in Phase 1, GSC setup, sitemap submission, on-page meta/title rewrites using validated SA keywords.
- **Short term (2–4 weeks)** — landing page copy rewrite, new ceremony-specific landing pages (one per ceremony × KZN/national), schema.org markup, internal linking.
- **Longer term (1–3 months)** — content/blog plan from keyword research, backlink outreach targets from Phase 3e, competitor gap content.

Each item will have: what, why (which finding/keyword it addresses), expected impact, effort.

## Technical notes

- Semrush database: `za` for all calls (SA market, .co.za TLD).
- GSC site identifier: `https://www.umcimbi.co.za/` (with trailing slash, matches the canonical redirect in `public/_redirects`).
- Sitemap base URL must be `https://www.umcimbi.co.za` to match the 301 in `_redirects`.
- Note: "AI search review" isn't a separate scanner — the existing `seo_chat` scan covers the on-page signals AI crawlers (ChatGPT/Perplexity/Gemini) use (semantic HTML, metadata, structured data, robots access). I'll call this out explicitly in findings rather than running a second tool.

## What I need from you mid-flight

- **Approval to publish** after I inject the GSC verification meta tag — verification fails if the tag isn't live on `www.umcimbi.co.za` at request time.
- Confirmation if the GSC connector picker shows multiple Google accounts (I'll surface the picker).
