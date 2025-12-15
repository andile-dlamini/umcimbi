-- Allow vendors to create service requests where they are the vendor
-- This enables vendors to send quotes directly without waiting for a client request
CREATE POLICY "Vendors can create service requests for their services" 
ON public.service_requests 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM vendors v 
    WHERE v.id = service_requests.vendor_id 
    AND v.owner_user_id = auth.uid()
  )
);

-- Also need to allow vendors to read profiles for the requester info
CREATE POLICY "Vendors can view profiles of users who requested their services"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM service_requests sr
    JOIN vendors v ON v.id = sr.vendor_id
    WHERE sr.requester_user_id = profiles.user_id
    AND v.owner_user_id = auth.uid()
  )
);