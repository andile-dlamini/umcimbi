## Fix upload-delivery-proof call in BookingDetail.tsx

The coordinated delivery-proofs security changes (just applied) updated the `upload-delivery-proof` edge function to expect `photo_path` (a storage path) instead of `photo_url` (a public URL). The `ChatThread.tsx` invoke was already updated, but `BookingDetail.tsx` still passes `photo_url`.

This plan makes a single surgical edit:

1. In `src/pages/bookings/BookingDetail.tsx`, locate the block where `supabase.storage.from('delivery-proofs').getPublicUrl(path)` is called to build a public URL, immediately followed by the `upload-delivery-proof` invoke using that URL.
2. Remove the `getPublicUrl` call and its `publicUrl` variable.
3. Change the invoke body from `{ booking_id: bookingId, photo_url: photoUrl }` to `{ booking_id: bookingId, photo_path: path }`.

No other lines in this file are touched. The `DeliveryProofPhotos` component is unchanged. No other files are modified. No deploy is needed.