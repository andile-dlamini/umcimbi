-- Drop the existing policy
DROP POLICY IF EXISTS "Users can update their own requests" ON public.service_requests;

-- Create a new policy with proper USING and WITH CHECK clauses
-- USING: checks if the user CAN update (current state)
-- WITH CHECK: checks if the resulting row is valid (new state)
CREATE POLICY "Users can update their own requests" 
ON public.service_requests 
FOR UPDATE 
USING (
  -- Who can update: requester on pending/quoted requests, or vendor owner
  (requester_user_id = auth.uid() AND status IN ('pending', 'quoted'))
  OR
  (EXISTS (
    SELECT 1 FROM vendors
    WHERE vendors.id = service_requests.vendor_id 
    AND vendors.owner_user_id = auth.uid()
  ))
)
WITH CHECK (
  -- What they can update to: any valid status change by the requester or vendor
  (requester_user_id = auth.uid())
  OR
  (EXISTS (
    SELECT 1 FROM vendors
    WHERE vendors.id = service_requests.vendor_id 
    AND vendors.owner_user_id = auth.uid()
  ))
);