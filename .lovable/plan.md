## Goal
Apply two surgical code changes to enforce a pending-approval workflow for new vendor registrations.

## Changes

### 1. New vendors start inactive (pending approval)
**File:** `src/hooks/useVendors.ts` (line 149)
- Change `is_active: true` → `is_active: false` inside `createVendorProfile`
- Effect: all newly created vendor profiles are hidden from the public marketplace until an admin explicitly activates them
- Existing vendors in the database are unaffected

### 2. Send registration confirmation SMS after onboarding
**File:** `src/pages/vendors/VendorOnboarding.tsx` (lines 330–331)
- After `createVendorProfile` succeeds and before `navigate(...)`, add a fire-and-forget Edge Function call:
  ```
  supabase.functions.invoke('send-vendor-status-sms', {
    body: { vendor_id: result.id, sms_type: 'registration' }
  }).catch(...)
  ```
- The call is non-blocking (not awaited) so navigation remains instant
- If the SMS function fails, it logs to console and does not interrupt the user flow

## Out of scope
- No admin page changes
- No database migrations
- No changes to existing vendor-facing pages