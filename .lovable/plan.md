## Secure delivery-proofs bucket (4 coordinated changes)

### 1. Migration: make `delivery-proofs` private
New migration sets `storage.buckets.public = false` for `delivery-proofs`, drops the old open read + open upload policies, and adds two participant-scoped policies on `storage.objects`:
- **Insert** allowed only if `auth.uid()` owns the vendor on the booking whose id matches the first path segment.
- **Select** allowed only for the booking's client or vendor owner (used via signed URLs).

### 2. `src/pages/chat/ChatThread.tsx`
Remove the `getPublicUrl` call after upload. Invoke `upload-delivery-proof` with `photo_path: path` instead of `photo_url: urlData.publicUrl`.

### 3. `supabase/functions/upload-delivery-proof/index.ts`
Rename the request field from `photo_url` to `photo_path` in four spots: destructuring, validation guard, append-to-existing array, and new-row insert. No other logic changes. Deploy with `supabase functions deploy upload-delivery-proof`.

### 4. `src/pages/bookings/BookingDetail.tsx`
Replace the inline `<img src={photo}>` grid (lines 396–407) with `<DeliveryProofPhotos proofs={deliveryProofs} />`. Add a new `DeliveryProofPhotos` component just below the imports that, for each stored path, calls `supabase.storage.from('delivery-proofs').createSignedUrl(path, 300)` and renders the resulting signed URLs in the same 3-col grid. Add `useEffect` to the existing `useState` import from React.

### Scope
- No other files, functions, tables, or policies touched.
- `trigger-vendor-payout` and other service-role flows are unaffected (service role bypasses storage RLS).
- Existing rows in `delivery_proofs.photos` that store full public URLs will not render after this change; new uploads (paths) will. Migrating historical rows is out of scope per the instructions.

### Deploy
`supabase functions deploy upload-delivery-proof` after the code changes.
