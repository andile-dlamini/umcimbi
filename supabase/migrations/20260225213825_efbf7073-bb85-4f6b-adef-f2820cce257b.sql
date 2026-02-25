-- Drop the existing vendor profile access policy
DROP POLICY IF EXISTS "Vendors can view profiles for active requests" ON public.profiles;

-- Recreate with broader access: active requests OR active bookings
CREATE POLICY "Vendors can view profiles for active requests or bookings"
ON public.profiles
FOR SELECT
USING (
  -- Own profile
  auth.uid() = user_id
  OR
  -- Vendor with active service request from this user
  EXISTS (
    SELECT 1
    FROM service_requests sr
    JOIN vendors v ON v.id = sr.vendor_id
    WHERE sr.requester_user_id = profiles.user_id
      AND v.owner_user_id = auth.uid()
      AND (
        sr.status IN ('pending', 'quoted', 'accepted')
        OR sr.updated_at > now() - interval '90 days'
      )
  )
  OR
  -- Vendor with active booking with this client
  EXISTS (
    SELECT 1
    FROM bookings b
    JOIN vendors v ON v.id = b.vendor_id
    WHERE b.client_id = profiles.user_id
      AND v.owner_user_id = auth.uid()
      AND (
        b.booking_status IN ('pending_deposit', 'confirmed')
        OR b.updated_at > now() - interval '90 days'
      )
  )
)