# Admin dashboard: lead with activation and conversion

Scope: `src/pages/admin/AdminDashboard.tsx` only. No query logic changes from the previous task.

## What changes

1. **Activation stats available at render** — the activation figures fetched in the previous task are stored in component state (`activation`) instead of only a local variable inside the fetch. The existing RPC call is reused; no second call.

2. **New "Activation and conversion" row** directly under the AI Daily Brief, with four cards styled exactly like the existing strips (same Card, `border-l-4`, padding, typography, Skeleton loading):
   - Ceremonies with a request sent — "of {total} ceremonies ({percent}%)", percent shown as 0 when there are no ceremonies.
   - Vendors who have quoted — "of {real vendors} vendors — {n} have ever responded".
   - Organisers who created a ceremony — "of {real organisers} — {n} sent a request".
   - Median time to first vendor reply — rounded hours with an "h" suffix, or "—" when unavailable; "across all requests answered".
   Cards 1 and 2 use an amber left border as a warning: card 1 when the percentage is under 25, card 2 when quoting vendors are fewer than a quarter of real vendors. All four render safely when the data hasn't loaded.

3. **Section order** becomes: AI Daily Brief → Activation and conversion → Real account statistics → Growth signals → Demand with no supply → Revenue strip → all remaining sections in their current relative order.

4. **Demand with no supply** — the zero-result searches list moves out of the "Search activity" card into its own card with that heading and the description "Searches that returned no vendors — your outreach priority list." Above the existing table, a compact summary lists the five most frequent searches with counts. Each search is labelled by category and/or location ("Catering in Umlazi", "Catering", or "Umlazi"); when both are missing the free-text query is used as the label, and rows with none of the three are skipped. The underlying query fetches up to 200 recent zero-result searches so the summary reflects a real outreach list, while the detailed table beneath still shows only the 20 most recent. When no metadata is available the table renders unchanged with no summary. The "Most searched categories" block stays in the Search activity card in its current position.

5. **Revenue label** — "Platform revenue earned" becomes "Platform revenue (contracted)".

6. **Growth row grid** — `lg:grid-cols-4` becomes `lg:grid-cols-5` so all five cards sit on one row. No other grid changes.

7. **Cleanup** — remove the unused `stalledCount` state and its setter call. The stalled conversations list and its section stay as-is.

Untouched: period selector, existing styling, skeleton states, `PLATFORM_FEE_RATE`, and every calculation.

## Technical notes

- `const [activation, setActivation] = useState<any>(null);` set via `setActivation(act ?? null);` immediately after the existing unwrap line.
- Combination summary computed with a `useMemo` over `zeroResultSearches`, keyed on `metadata.category` + `metadata.location`, sorted desc, sliced to 5, using the existing `categoryLabels` map.
