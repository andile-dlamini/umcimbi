CREATE POLICY "Admins can view all events" ON public.events
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all service requests" ON public.service_requests
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all quotes" ON public.quotes
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));