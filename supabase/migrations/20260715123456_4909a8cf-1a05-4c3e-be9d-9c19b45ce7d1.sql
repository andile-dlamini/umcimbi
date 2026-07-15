DROP TRIGGER IF EXISTS notify_first_message ON public.messages;
CREATE TRIGGER notify_first_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_first_message();

DROP TRIGGER IF EXISTS notify_new_service_request ON public.service_requests;
CREATE TRIGGER notify_new_service_request
AFTER INSERT ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_new_service_request();