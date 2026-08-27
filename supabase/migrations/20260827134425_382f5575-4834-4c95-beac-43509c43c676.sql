ALTER TABLE public.feedback DROP CONSTRAINT feedback_feedback_type_check;
ALTER TABLE public.feedback ADD CONSTRAINT feedback_feedback_type_check
  CHECK (feedback_type IN ('bug','idea','praise','other','unmet_demand'));