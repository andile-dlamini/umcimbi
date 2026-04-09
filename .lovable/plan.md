

## Plan: Full Escrow Release Flow

### Summary
Implement the complete escrow release lifecycle: vendor uploads proof → client confirms or disputes → funds auto-release after 48 hours → admin notified on disputes. Five edge functions, two migrations, storage bucket, and frontend updates.

### 1. Database Migration — Schema Changes
- Add 4 columns to `bookings`: `dispute_raised_at` (timestamptz), `dispute_raised_by` (text), `funds_released_at` (timestamptz), `client_confirmed_at` (timestamptz)
- Create `delivery-proofs` storage bucket (public, authenticated uploads)
- RLS policies: authenticated users can upload, public can read

### 2. Database Migration — Enable Extensions + pg_cron Job
A **separate migration** that:
- `CREATE EXTENSION IF NOT EXISTS pg_cron;`
- `CREATE EXTENSION IF NOT EXISTS pg_net;`

Then use the **insert tool** (not migration) to schedule the cron job, since it contains project-specific URL and anon key:
```sql
SELECT cron.schedule(
  'escrow-auto-release',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://pnnckeqrzjglcwkyzzxg.supabase.co/functions/v1/release-escrow',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubmNrZXFyempnbGN3a3l6enhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNzcxMjAsImV4cCI6MjA4MDg1MzEyMH0.HzvgyP7gUS2fDwQfuuLLhwF_SDKoBgH41AiGUJtHSRE"}'::jsonb,
    body := '{"mode":"auto"}'::jsonb
  ) AS request_id;
  $$
);
```

### 3. Edge Functions (5 new, all `verify_jwt = false` in config.toml)

| Function | Purpose |
|---|---|
| `upload-delivery-proof` | Vendor uploads proof photo, inserts to `delivery_proofs`, sends 2 system chat messages |
| `confirm-delivery` | Client confirms, sets `client_confirmed_at`, invokes `release-escrow` |
| `raise-dispute` | Sets status to `disputed`, posts chat message, emails admin (fail-safe) |
| `release-escrow` | Core release logic — 3 modes: `client_confirmed`, `admin`, `auto` (batch query for 48hr expiry) |
| `trigger-vendor-payout` | Stub — logs and returns success |

All use manual JWT auth pattern (read Authorization header → `supabaseAuth.auth.getUser(token)` → 401 if invalid), same as `create-ozow-payment`.

### 4. Frontend: `BookingDetail.tsx`
- **Vendor section**: Warning banner if event date passed + no proof; upload card with file input → Storage upload → edge function call; green confirmation if proof exists
- **Client section**: "Waiting for proof" when no proofs; Confirm + Dispute buttons when proofs exist
- **Disputed card**: Amber warning for both parties
- **Completed card**: Green success with role-specific text

### 5. Frontend: `useBookings.ts`
- `markAsCompleted` → invoke `confirm-delivery`
- `reportProblem` → invoke `raise-dispute`

### 6. `ozow-webhook/index.ts` — Balance Messages Only
Replace the two balance payment system message strings with escrow-aware versions. No other changes.

### 7. `TermsOfService.tsx`
Add "Service Delivery & Fund Release" section with the 7 bullet points.

### 8. `supabase/config.toml`
Add 5 function blocks: `upload-delivery-proof`, `confirm-delivery`, `raise-dispute`, `release-escrow`, `trigger-vendor-payout`.

### Files Changed
| File | Action |
|---|---|
| Migration 1 | Add 4 columns + storage bucket + RLS |
| Migration 2 | Enable `pg_cron` + `pg_net` extensions |
| Insert tool | Schedule cron job (project-specific data) |
| 5 new edge function files | Create |
| `supabase/config.toml` | Add 5 function blocks |
| `supabase/functions/ozow-webhook/index.ts` | Edit 2 message strings |
| `src/pages/bookings/BookingDetail.tsx` | Major UI additions |
| `src/hooks/useBookings.ts` | Edit 2 methods |
| `src/pages/legal/TermsOfService.tsx` | Add section |

### What Will NOT Change
Deposit flow, `create-ozow-payment`, webhook hash/credential/payment-record logic, vendor dashboard, review trigger logic, existing delivery proofs grid, escrow info card, `EftPaymentDialog`.

