-- Drop the existing restrictive update policy
DROP POLICY IF EXISTS "Users can update their own pending requests" ON public.service_requests;

-- Create a new policy that allows clients to update requests in pending OR quoted status
CREATE POLICY "Users can update their own requests" 
ON public.service_requests 
FOR UPDATE 
USING (
  (requester_user_id = auth.uid() AND status IN ('pending', 'quoted'))
  OR
  (EXISTS (
    SELECT 1 FROM vendors
    WHERE vendors.id = service_requests.vendor_id 
    AND vendors.owner_user_id = auth.uid()
  ))
);