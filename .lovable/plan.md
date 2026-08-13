# Make quote documents readable, and cost the real-PDF option

## Headers first — measured, not assumed

I could not mint a signed quote URL myself: the preview has no session (`hasSession: false`) and all three stored demo logins now return `invalid_credentials`, so I could not click View as the admin.

What I could measure, on the same storage service and the same object handler, using a real stored object:

```text
GET /storage/v1/object/public/vendor-images/.../doc-...pdf
HTTP/2 200
content-type: application/pdf
cache-control: public, max-age=3600
(no content-disposition, no x-content-type-options)
```

Two conclusions:

- Storage sends **no `Content-Disposition` at all** unless `?download` is passed, and `get-final-offer-url` calls `createSignedUrl(key, 300)` with no options. So the file is **not** being forced to download by disposition. Requesting inline disposition is not the fix — it would be a no-op.
- Storage returns the stored content type verbatim for this object. Whether it does the same for `text/html`, or downgrades it to `text/plain` as some Storage deployments do to stop uploaded HTML executing on the storage origin, is the one thing still unmeasured, and it is exactly the difference between "renders" and "shows source".

Rather than block the fix on that unknown, the fix below is chosen so that it works either way: the app never hands the storage URL to the browser, so whatever header Storage would have sent stops mattering.

## 1. Make the quote readable (priority)

`get-final-offer-url` keeps its current authentication and authorisation untouched — 401 with no valid header, 403 unless caller is the requesting client, owning vendor, or admin. After the access check passes it additionally downloads the stored object with its existing service-role client and returns the markup in the response alongside the existing `url` and `offer_number` fields, so nothing that reads `url` today breaks.

`viewQuotePdfAction` in `src/lib/quoteActions.ts` keeps the synchronous `window.open` popup-gesture trick it already has, then writes the returned markup into that tab as a `text/html` blob URL. Same pattern the app already uses elsewhere for documents. Result: the quote renders as a formatted page, printable to PDF from the browser, on desktop and mobile, regardless of what Storage would have served.

If the markup is missing from the response for any reason, it falls back to the signed URL exactly as today, so this cannot be worse than the current behaviour.

Not in scope of this step, but flagged: `orders/*.html` in the same bucket, served by `get-order-pdf-url`, has the identical problem. Say the word and it gets the same treatment in the same pass.

## 2. Copy

- "View PDF" becomes "View quote" in `MyQuotes.tsx`, `VendorQuotations.tsx`, `QuoteCard.tsx`. `BookingDetail.tsx` triggers the same action and gets the same wording where it is user-visible.
- The two failure toasts in `quoteActions.ts` stop naming a PDF: "Failed to load PDF" and "Could not load PDF" become "Couldn't open the quote".

## 3. Name the artefact honestly in code

`final_offer_pdf_key` stays as it is — no migration, no renames. A one-line comment goes where it is written in `generate-final-offer` and where it is read in `get-final-offer-url`, stating that the stored artefact is HTML, not a PDF, despite the column name.

## Separately: what a real PDF via an external service actually costs

The naive version is fifteen lines. The version that satisfies "the quote must still send" is not, because today the upload sits on the critical path: if the store fails, `generate-final-offer` returns 500 and the quote does not complete. Wiring a third-party call into that same path makes a vendor's send depend on someone else's uptime.

What it takes to avoid that:

- **HTML stays the source of truth.** The existing HTML is generated and uploaded first, exactly as today, and the quote completes on that alone. The PDF is an enhancement layered on afterwards, never a precondition.
- **The conversion call is best-effort and time-boxed.** A short timeout with abort; any 5xx, timeout or network error is caught, logged, and swallowed. The vendor's send returns success either way.
- **A retry record.** A small table row per quote tracking pdf state (pending / succeeded / failed), attempt count and last error, so a failed conversion is a known fact rather than a silent gap.
- **A retry worker.** A scheduled function picking up pending and failed rows with bounded attempts and backoff, converting and storing the PDF at a `.pdf` key with `application/pdf`.
- **Readers tolerate both.** `get-final-offer-url` prefers the PDF when one exists and falls back to the HTML when it does not, so the document is always openable during the window before conversion succeeds.
- **A new secret** for the service, plus its per-document cost, and quote documents transiting a third party.

So: one migration, one new scheduled function, changes to `generate-final-offer` and `get-final-offer-url`, and the operational surface of a queue. Worth doing, but a separate piece of work with its own plan — this plan does not start it.
