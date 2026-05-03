## Fix raise-dispute admin notification email

Replace the broken `fetch` to `/functions/v1/send-transactional-email` in `supabase/functions/raise-dispute/index.ts` with the `enqueue_email` RPC pattern (same as `auth-email-hook`), enqueuing into the `transactional_emails` pgmq queue that `process-email-queue` already drains.

### Scope

- **Only file modified:** `supabase/functions/raise-dispute/index.ts` (admin notification block only).
- All other logic (auth, booking lookup, RLS check, status update, system message insert, response shape) untouched.
- No migrations, RLS, or other functions changed.

### Steps

1. Replace the admin email `try/catch` block in `raise-dispute/index.ts`:
   - Generate `messageId` via `crypto.randomUUID()`.
   - Insert `pending` row into `email_send_log` (template `admin_dispute_alert`).
   - Build branded HTML + plain-text dispute alert.
   - Call `supabase.rpc('enqueue_email', { queue_name: 'transactional_emails', payload })` with literal `from: "UMCIMBI <noreply@umcimbi.co.za>"` and `sender_domain: "notify.umcimbi.co.za"`, `purpose: "transactional"`, `label: "admin_dispute_alert"`.
   - On enqueue error, update log row to `failed`.
   - Outer `try/catch` keeps it fail-safe.
2. Deploy with `deploy_edge_functions(["raise-dispute"])`.
3. Verify: raise a dispute, confirm `email_send_log` row goes `pending` → `sent` and the admin inbox receives the alert.