
CREATE OR REPLACE FUNCTION public.evaluate_super_vendor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.jobs_completed >= 20 AND NEW.rating >= 4.8 THEN
    NEW.is_super_vendor := true;
    IF OLD.is_super_vendor = false THEN
      NEW.super_vendor_awarded_at := now();
      NEW.super_vendor_reason := 'Auto-awarded: 20+ jobs, 4.8+ rating';
    END IF;
  ELSE
    NEW.is_super_vendor := false;
    NEW.super_vendor_awarded_at := null;
    NEW.super_vendor_reason := null;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_evaluate_super_vendor
  BEFORE UPDATE OF jobs_completed, rating ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.evaluate_super_vendor();
