## Province-based launch restriction (KwaZulu-Natal only)

Users can still sign up freely; only marketplace actions (browse vendors, request quotes, book, pay) are gated. Enforcement = RLS + a gate at event creation and vendor onboarding. **No changes to Ozow, accept-quote, release-escrow, or confirm-delivery edge functions.**

---

### 1. Database migration (single call)

- Create `public.live_provinces` (province PK, launched_at). Seed `'KwaZulu-Natal'`. Enable RLS + public SELECT policy. GRANT SELECT to anon + authenticated, ALL to service_role.
- Create `public.is_province_live(text) returns boolean` — STABLE SECURITY DEFINER, `search_path = public`.
- `ALTER TABLE public.events ADD COLUMN state_province text;` then backfill existing rows to `'KwaZulu-Natal'`.
- Backfill `public.vendors.state_province` to `'KwaZulu-Natal'` where null/blank.
- Replace vendor SELECT policy → require `is_active AND is_province_live(state_province)`.
- Replace `service_requests` INSERT policy → require the linked event's province is live.
- Replace `quotes` INSERT policy (vendor-created) → require the linked event's province is live.
- Replace `messages` INSERT policy → allow when conversation has no event, or event's province is live.

All SQL exactly as specified in the request.

### 2. Frontend

**a. Export `SA_PROVINCES` from `src/components/shared/AddressFields.tsx`** (currently a private const) so both screens reuse the same list.

**b. `src/pages/events/CreateEvent.tsx`**
- Add required `state_province` `<Select>` (uses `SA_PROVINCES`) alongside the existing free-text location field. Add to zod schema + validation.
- On submit: query `public.live_provinces` for the chosen province.
  - If live → include `state_province` in the insert and proceed as today.
  - If not live → do NOT create event; render a waitlist screen with the exact copy:
    > "UMCIMBI is currently live in KwaZulu-Natal only. We are expanding province by province to make sure every vendor is properly verified and every booking is supported. Join the waitlist and we'll notify you when we launch in your area."
  - Waitlist form captures name, phone, province (pre-filled), city/town, event type; insert into `waitlist_signups` with `role = 'organiser'`.

**c. `src/pages/vendors/VendorOnboarding.tsx`**
- Make `state_province` required in the zod schema (drop `.optional()`).
- After the business address step, check `is_province_live` for the chosen province.
  - If live → continue existing flow (vendor still starts `is_active: false` pending admin approval — unchanged).
  - If not live → do NOT create vendor; show the waitlist screen (vendor-adapted copy, same core message) capturing name, phone, province, city/town; insert into `waitlist_signups` with `role = 'vendor'`.

**d. `src/hooks/useVendors.ts`**
- Add explicit `.eq('state_province', 'KwaZulu-Natal')` to the vendor query so UI matches what RLS would return.

**e. `waitlist_signups`**
- Migration adds `province`, `city`, `event_type` columns (all nullable text). Both waitlist submissions use them; `event_type` left null for the vendor path.

### 3. Verification

- After migration approval + regenerated types: `bun tsgo` (typecheck).
- Manual sanity check: `useVendors` still returns rows; creating an event in a non-live province shows waitlist screen; creating one in KZN succeeds.

### Explicitly out of scope

- No changes to Ozow edge functions, `accept-quote`, `release-escrow`, `confirm-delivery`.
- No province checks inside any edge function.
- No changes to the existing pre-launch waitlist gate or admin approval flow for vendors.
