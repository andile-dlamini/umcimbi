-- Create service request status enum
CREATE TYPE public.service_request_status AS ENUM ('pending', 'quoted', 'accepted', 'declined', 'completed', 'cancelled');

-- Create service_requests table for organisers to request quotes from vendors
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  requester_user_id UUID NOT NULL,
  status service_request_status NOT NULL DEFAULT 'pending',
  message TEXT,
  event_date DATE,
  guest_count INTEGER,
  budget_range TEXT,
  vendor_response TEXT,
  quoted_amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(event_id, vendor_id)
);

-- Enable RLS
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Organisers can view their own requests
CREATE POLICY "Users can view their own service requests"
ON public.service_requests
FOR SELECT
USING (
  requester_user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.vendors
    WHERE vendors.id = service_requests.vendor_id
    AND vendors.owner_user_id = auth.uid()
  )
);

-- Policy: Organisers can create service requests
CREATE POLICY "Users can create service requests"
ON public.service_requests
FOR INSERT
WITH CHECK (
  requester_user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = service_requests.event_id
    AND events.owner_user_id = auth.uid()
  )
);

-- Policy: Organisers can update their own pending requests
CREATE POLICY "Users can update their own pending requests"
ON public.service_requests
FOR UPDATE
USING (
  (requester_user_id = auth.uid() AND status = 'pending') OR
  EXISTS (
    SELECT 1 FROM public.vendors
    WHERE vendors.id = service_requests.vendor_id
    AND vendors.owner_user_id = auth.uid()
  )
);

-- Policy: Organisers can delete their own pending requests
CREATE POLICY "Users can delete their own pending requests"
ON public.service_requests
FOR DELETE
USING (
  requester_user_id = auth.uid() AND status = 'pending'
);

-- Trigger for updated_at
CREATE TRIGGER update_service_requests_updated_at
BEFORE UPDATE ON public.service_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add vendor role when a vendor profile is created
CREATE OR REPLACE FUNCTION public.add_vendor_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.owner_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.owner_user_id, 'vendor')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to add vendor role
CREATE TRIGGER on_vendor_created
AFTER INSERT ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.add_vendor_role();