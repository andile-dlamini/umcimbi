# Diagnosis first: the twelve functions are not broken, and neither is the gateway

The original diagnosis was wrong. Evidence below. No code change is proposed in this plan.

## 1. The platform gateway is not blocking any of these functions

A function whose calls are blocked by the gateway never runs, and the caller gets the gateway's own error envelope. A function that runs and rejects the call itself returns its own error body.

Live probe results (no valid user token supplied):

```text
process-email-queue   (verify_jwt = true in config)
  -> 401 {"code":"UNAUTHORIZED_NO_AUTH_HEADER","message":"Missing authorization header"}   <- gateway, body never ran

get-final-offer-url   (no config entry)
  -> 401 {"error":"Unauthorized"}      <- the function's own line-23 response, body DID run
accept-quote          -> 401 {"error":"Unauthorized"}      <- own response, body ran
decline-quote         -> 401 {"error":"Unauthorized"}      <- own response, body ran
create-ozow-payment   -> 401 {"error":"Unauthorized"}      <- own response, body ran
send-quote            -> 401 {"error":"Unauthorized"}      <- own response, body ran
```

Functions with no `config.toml` entry default to `verify_jwt = false` on this project, not `true`. That is the answer to question 2: nothing distinguishes `send-quote` from `get-final-offer-url`. Both run their own authentication, both are reached by callers, and `send-quote` works because there was never a gateway block on either. The other ten are in the same position — not broken, and not at risk from this.

## 2. get-final-offer-url has returned 2xx recently

Edge invocation logs show a call to `get-final-offer-url` at 13:52 UTC today returning **200**. So the PDF endpoint is executing and succeeding for at least one caller.

Full per-function 2xx history for all twelve is not retrievable: the analytics log store only retains roughly the last hour of `function_edge_logs`, so "when did each last return 2xx" cannot be answered beyond that window. Within the retained window, the only invocation of any of the twelve is that successful `get-final-offer-url` 200.

## 3. accept-quote and create-ozow-payment

They cannot be confirmed as ever having completed successfully from logs, because of the same one-hour retention limit — but they are demonstrably reachable and executing. Against a non-existent id and no user token they return their own `401 {"error":"Unauthorized"}`; with a valid session they proceed to the quote/booking lookup. There is no gateway-level failure on either.

Supporting data: all three quotes in the system have a `final_offer_pdf_key` and a `final_offer_pdf_generated_at`, so `get-final-offer-url` has real PDFs to sign. Bookings exist from the accept path, which is consistent with `accept-quote` having run.

## What this means for "Failed to load PDF"

`Failed to load PDF` in `src/lib/quoteActions.ts` is shown for any `invoke` error, so it covers 401, 403, 404 and 500 alike. Since the function runs and has recently returned 200, the likely causes are caller-specific rather than platform-wide: an expired or missing session at click time (401), a caller who is not client, vendor owner, or admin (403), or the browser blocking the pre-opened tab.

## Recommended next step (no changes yet)

Reproduce the failure with the specific account and quote that fails, capture the actual status and body from the invoke error context, then fix the real cause. Adding a `verify_jwt = false` entry for `get-final-offer-url` would be harmless but is a no-op — it matches the effective default and will not change the outcome.

I have not changed `supabase/config.toml` or any function.
