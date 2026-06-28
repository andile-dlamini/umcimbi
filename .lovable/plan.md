
## Goal
Make "View PDF" (quote) and "Order PDF" (order) buttons work reliably on mobile Safari and in-app browsers (WhatsApp, etc.). Hide the Order PDF button when no PDF has been generated yet.

## Root cause
In `src/lib/quoteActions.ts`, both `viewQuotePdfAction` and `viewOrderPdfAction` `await` the signed-URL edge function BEFORE opening a tab. By the time the URL resolves, the browser no longer considers `window.open()`/anchor click a trusted user-gesture result, so strict mobile browsers silently block it. Edge functions are correct and unchanged.

## Changes

### 1. `src/lib/quoteActions.ts` — `viewQuotePdfAction`
- First line inside `try`: `const win = window.open('', '_blank', 'noopener,noreferrer');`
- Then invoke `get-final-offer-url` as today.
- On any failure path (invoke error, missing/invalid url, server `error` field): `if (win) win.close();` then existing `toast.error(...)`.
- On success: if `win` exists, `win.location.href = url;` else fall back to `window.location.href = url;` (same-tab fallback when blank popup was blocked).
- Remove the synthetic anchor-click code path.

### 2. `src/lib/quoteActions.ts` — `viewOrderPdfAction`
- Same synchronous-`window.open('')` first pattern.
- Invoke `get-order-pdf-url`; on failure close `win` and toast the existing message (missing url, invoke error, access denied, not yet generated).
- On success: `win.location.href = url;` (or `window.location.href = url;` fallback if `win` null).
- Remove the secondary `fetch(url)` + `Blob` + `URL.createObjectURL` flow and its failure branch — order PDF is already served as `text/html` from the signed URL.
- Remove the now-unused `openBlobUrl` helper (no other references in the file).

### 3. `src/pages/bookings/ClientBookings.tsx`
- Wrap the existing "Order PDF" `<Button>` in `CardFooter` with `{booking.order_pdf_key && ( ... )}`, mirroring the `quote.final_offer_pdf_key` guard in `VendorQuotations.tsx` and the `(booking as any).order_pdf_key` guard in `BookingDetail.tsx`. The "Open Chat" button stays unconditional.

## Out of scope
- No changes to `get-final-offer-url` or `get-order-pdf-url` edge functions.
- No backend / RLS / data changes.
- No changes to chat-thread PDF flows or other call sites.

## Verification
- Build passes.
- Manually: tap View PDF on a quote card and Order PDF on an order card from mobile Safari / WhatsApp in-app browser → new tab opens and loads the document.
- Orders without an `order_pdf_key` no longer show the Order PDF button.
