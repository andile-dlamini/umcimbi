Wrap the fire-and-forget `fetch` call in `supabase/functions/accept-quote/index.ts` with `EdgeRuntime.waitUntil(...)` so the Supabase edge runtime keeps the function alive until the Order Confirmation PDF generation completes, preventing silent failures when the execution context is torn down early.

**Scope**: single file, single code block — no other files or logic are touched.

**Technical detail**
- File: `supabase/functions/accept-quote/index.ts`
- Change lines 132–140: replace the bare `fetch(...).catch(...)` with `EdgeRuntime.waitUntil(fetch(...).catch(...))`.
- Preserve existing headers, body, error logging, and response timing (no `await` added).
- No changes to `generate-order-confirmation/index.ts`, `get-order-pdf-url/index.ts`, booking creation, system-message inserts, or the final Response.