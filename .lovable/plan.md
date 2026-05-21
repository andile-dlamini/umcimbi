# Security Remediation Plan — 25 Findings

Grouped by area. Each item lists the fix approach. Nothing is changed yet — this is for your approval.

---

## 1. Storage bucket exposure (4 fixes)

### 1.1 `delivery-proofs` bucket — public read (ERROR + WARN duplicate)
- Flip bucket to **private**.
- Drop "Public can read delivery proofs" policy.
- Add participant-scoped SELECT policy (uploader, booking client, or vendor owner).
- Update `confirm-delivery` / any client code to fetch via short-lived signed URLs.

### 1.2 `payment-proofs` bucket — any auth user can read all (ERROR + duplicate STORAGE_EXPOSURE)
- Replace SELECT/INSERT policies with participant-scoped checks joining `payment_proofs` → `bookings`.
- Only payer, vendor owner, or admin may read; only the booking's client may insert under their own path.

### 1.3 `vendor-images` bucket — any auth user can overwrite/delete
- Drop the three broad "Authenticated users can upload/update/delete vendor images" policies.
- Keep only the existing owner-scoped policy (path prefixed with `auth.uid()`).

### 1.4 Public bucket allows listing (Supabase linter)
- For remaining public buckets (`avatars`, `vendor-images`, `email-assets`), restrict `storage.objects` SELECT to direct object reads rather than full listing; or accept where intentional and document in security memory.

---

## 2. Table RLS hardening (6 fixes)

### 2.1 `vendors` — bank details readable by all auth users (ERROR)
- Create `vendors_public` view exposing only marketing fields.
- Replace broad "Active vendors viewable by authenticated users" SELECT policy with a column-safe version: full row only for `owner_user_id = auth.uid()` or admin; public reads go through the view.
- Update client queries to use the view where appropriate.

### 2.2 `vendor_payouts.encryption_key` exposed (ERROR)
- Move `encryption_key` to a service-role-only table (`vendor_payout_secrets`) keyed by `vendor_payout_id`.
- Drop the column from `vendor_payouts`.
- Edge functions that need it use the service role to fetch.

### 2.3 `sms_balance_checks` published to Realtime (ERROR)
- `ALTER PUBLICATION supabase_realtime DROP TABLE public.sms_balance_checks`.

### 2.4 `realtime.messages` no channel policies (ERROR)
- Add RLS policies on `realtime.messages` restricting subscriptions to topics the user owns (conversation participant, booking party). Reserved-schema caveat: implement via Supabase Realtime authorization helpers rather than direct DDL on `realtime` schema if blocked.

### 2.5 `profiles` — 90-day vendor access to PII (WARN)
- Tighten policy: vendors see only `first_name`, `surname`, `avatar_url` via a `profiles_vendor_view`.
- Remove address/phone from the policy-exposed columns; planners share contact via chat instead.

### 2.6 `email_unsubscribe_tokens` / `otp_requests` (WARN x2)
- Confirm no anon/auth INSERT policies exist (they don't currently — keep service-role only).
- Add explicit `REVOKE` to be defensive; document in security memory.

---

## 3. Edge function auth (5 fixes — all ERROR)

### 3.1 `admin-daily-brief`
- Require valid JWT, then `has_role(uid,'admin')` OR service role key match.

### 3.2 `release-escrow`
- Require valid JWT.
- `client_confirmed` mode: caller must be booking's `client_id`.
- `admin` mode: must be admin.
- `auto` mode: must present service role key (used by cron only).

### 3.3 `trigger-vendor-payout`
- Replace string-length check with `supabaseAuth.auth.getUser(token)` validation.
- Allow only admin or service-role caller.

### 3.4 `ozow-payout-notification`
- Add shared-secret header check (new secret `OZOW_PAYOUT_NOTIFY_TOKEN`) compared in constant time.
- Reject anything else as 401.

### 3.5 `seed-demo-users`
- Require service role key as Bearer.
- Stop returning the demo password in the response body.

---

## 4. Storage policy logic bug (1 fix — WARN)

### 4.1 `quote-pdfs` vendor read policy joins on `v.name`
- Rewrite policy to `q.vendor_id = v.id AND q.final_offer_pdf_key = objects.name`.

---

## 5. Database hygiene (Supabase linter — 5 items)

### 5.1 SECURITY DEFINER functions executable by anon/authenticated (2 warns)
- Audit each SECURITY DEFINER function (`has_role`, `update_vendor_rating`, etc.).
- `REVOKE EXECUTE ... FROM anon, authenticated` where not intended to be called directly.

### 5.2 Function search_path mutable (1 warn)
- Add `SET search_path = public` to any function missing it (e.g., `enqueue_email`, `delete_email`, `read_email_batch`, `move_to_dlq`).

### 5.3 Permissive RLS policy `USING (true)` on write op (1 warn)
- Locate the offending policy and scope it to ownership.

### 5.4 RLS enabled, no policy (1 info)
- Identify the table; add policies or disable RLS if table is service-role only.

---

## 6. Auth configuration (1 fix — WARN)

### 6.1 Leaked Password Protection disabled
- Enable HIBP password check via `configure_auth`.

---

## Execution order

1. **Phase A — Database migrations** (sections 2, 4, 5): one consolidated migration, requires your approval.
2. **Phase B — Storage migrations** (section 1): bucket privacy + policies.
3. **Phase C — Edge function rewrites** (section 3): code edits only, auto-deploys.
4. **Phase D — Auth config + security memory update** (section 6): `configure_auth` + `update_memory`.

After each phase I'll re-run the security scan and mark findings fixed.

---

## Risks / things to confirm before I touch code

- **Realtime channel policies (2.4)**: writing to `realtime.messages` may be blocked as reserved schema. Fallback: drop the affected tables from the publication instead.
- **`vendors` view migration (2.1)**: existing frontend queries against `vendors.*` will need to be reviewed — I'll keep owner self-read intact so vendor dashboards keep working.
- **`encryption_key` move (2.2)**: confirm no current edge function reads it via anon client; if yes I'll update those callers in the same phase.
- **Demo password (3.5)**: I'll surface it only to the calling admin via logs, not the response. OK?
