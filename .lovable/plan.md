
Implement the Ozow Payouts backend webhook setup, keeping the original plan and adding the two requested requirements.

## Scope

This will add payout infrastructure without changing any existing table structures.

### Explicit constraints

- Do not alter existing `bookings` structure.
- Do not alter existing `escrow_transactions` structure if present later; no changes will target it.
- Do not alter any existing table structure.
- Only add new payout-specific tables.
- `vendor_payouts.booking_id` will reference `bookings.id`.
- `payout_webhook_events.vendor_payout_id` will reference `vendor_payouts.id`.
- Existing customer payment, deposit, balance, and escrow release logic will remain unchanged except for calling the completed payout trigger.

## What will be built

### 1. Generate Ozow Payouts access token

Generate a cryptographically secure 24-character access token and store it as a backend runtime secret:

```text
OZOW_PAYOUT_ACCESS_TOKEN
```

This token will be used in two places:

- Sent to Ozow as the required static “Access Token”.
- Sent by the app to Ozow Payouts API in the payout request header.
- Validated on incoming payout webhook calls from Ozow.

After implementation, the token will be provided once so it can be sent to Ozow.

## 2. Add payout tracking table

Create a new table:

```text
vendor_payouts
```

This table will track every payout attempt.

It will include:

- `id`
- `booking_id`
- `vendor_id`
- `amount`
- `currency`
- `internal_reference`
- `ozow_payout_id`
- `ozow_reference`
- `status`
- `failure_reason`
- `request_payload`
- `response_payload`
- `created_at`
- `updated_at`
- `submitted_at`
- `paid_at`
- `failed_at`

Relationship:

```text
vendor_payouts.booking_id → bookings.id
```

It will not add any payout columns to `bookings`.

## 3. Add payout webhook event table

Create a new table:

```text
payout_webhook_events
```

This table will store sanitized Ozow callback events for audit/debugging.

It will include:

- `id`
- `vendor_payout_id`
- `event_type`
- `ozow_status`
- `raw_payload`
- `redacted_payload`
- `headers_redacted`
- `created_at`

Relationship:

```text
payout_webhook_events.vendor_payout_id → vendor_payouts.id
```

Sensitive fields such as access tokens, authorization headers, account numbers, branch codes, and bank details will be redacted before storage.

## 4. Secure table access

Add RLS policies for the two new tables:

### `vendor_payouts`

- Admins can view payout records.
- Vendors can view payout records for their own vendor profile.
- Inserts and updates are restricted to trusted backend function execution.

### `payout_webhook_events`

- Admins can view webhook event logs.
- Vendors do not need direct access to raw webhook events.
- Inserts are restricted to trusted backend function execution.

## 5. Add payout verification URL

Create a backend function:

```text
ozow-payout-verification
```

This endpoint will be given to Ozow as the Verification URL.

It will:

- Accept Ozow verification requests.
- Support JSON and form-encoded payloads.
- Validate `OZOW_PAYOUT_ACCESS_TOKEN`.
- Look up the referenced payout if a payout reference is supplied.
- Return a clear allow/deny response.
- Store a sanitized webhook event when appropriate.
- Avoid exposing bank details, tokens, or internal secrets in responses/logs.

## 6. Add payout notification URL

Create a backend function:

```text
ozow-payout-notification
```

This endpoint will be given to Ozow as the Notification URL.

It will:

- Accept Ozow payout status callbacks.
- Support JSON and form-encoded payloads.
- Validate `OZOW_PAYOUT_ACCESS_TOKEN`.
- Match the callback to `vendor_payouts` using the internal reference and/or Ozow payout reference.
- Normalize Ozow statuses into internal statuses such as:
  - `pending`
  - `submitted`
  - `paid`
  - `failed`
  - `rejected`
- Insert a sanitized event into `payout_webhook_events`.
- Update the matching `vendor_payouts` record with success/failure status, timestamps, and failure reason where applicable.

## 7. Update `trigger-vendor-payout`

Replace the current stub with the real initial Ozow Payouts API call.

The updated function will:

1. Receive `booking_id`.
2. Load the booking using backend privileges.
3. Confirm the booking is eligible for payout:
   - booking exists
   - funds have been released
   - booking is completed
   - no duplicate successful payout already exists
4. Load the vendor payout/bank details from the vendor profile.
5. Validate required vendor bank fields:
   - bank name
   - account holder name
   - account number
   - account type
   - branch code
6. Create a `vendor_payouts` record before calling Ozow.
7. Build the Ozow Payouts request payload using:
   - booking reference
   - vendor bank details
   - payout amount
   - internal payout reference
8. Call the Ozow Payouts API.
9. Pass the `OZOW_PAYOUT_ACCESS_TOKEN` in the request header.
10. Update the `vendor_payouts` record based on the initial Ozow response:
    - submitted/queued if accepted
    - failed/rejected if refused
    - store sanitized response details
11. Return a clear success/failure response to the caller.

The exact Ozow endpoint URL and final request shape will follow Ozow’s Payouts documentation. If the docs require an additional staging API base URL or credential not currently configured, the implementation will use a clearly named runtime secret for that value rather than hardcoding it.

## 8. Function configuration

Add backend function entries for:

```text
ozow-payout-verification
ozow-payout-notification
```

These endpoints must allow external Ozow calls, so gateway JWT verification will be disabled for these two functions. Security will be handled by the static access token validation inside the function.

`trigger-vendor-payout` already exists and will remain callable by trusted backend functions.

## URLs to give Ozow after implementation

Using the live project domain, the URLs will be:

```text
Notification URL:
https://umcimbi.co.za/functions/v1/ozow-payout-notification

Verification URL:
https://umcimbi.co.za/functions/v1/ozow-payout-verification
```

If Ozow requires the Lovable backend function domain instead of the public custom domain, the equivalent function URLs will also be provided after implementation.

## Access Token to give Ozow

A secure 24-character token will be generated during implementation and stored as:

```text
OZOW_PAYOUT_ACCESS_TOKEN
```

It will be shown once after creation so it can be sent to Ozow.

## Files expected to change

```text
supabase/functions/trigger-vendor-payout/index.ts
supabase/functions/ozow-payout-verification/index.ts
supabase/functions/ozow-payout-notification/index.ts
supabase/config.toml
supabase/migrations/<new-payouts-migration>.sql
```

## Files and structures that will not be touched

```text
bookings table structure
escrow_transactions table structure
existing payment/deposit/balance table structures
existing customer Ozow payment flow
existing vendor profile table structure
existing frontend UI
```

## Technical notes

- The payout tables are additive only.
- Foreign keys will be added only from new payout tables to existing tables.
- Sensitive payout payloads will be redacted before storage.
- The webhook endpoints will accept common token locations:
  - `Authorization: Bearer <token>`
  - `x-access-token: <token>`
  - `AccessToken` / `accessToken` in request body
- `trigger-vendor-payout` will use backend service credentials internally and will not expose vendor bank details to the frontend.
- Duplicate payout prevention will be handled by checking for existing active/successful `vendor_payouts` records for the booking before creating a new one.
