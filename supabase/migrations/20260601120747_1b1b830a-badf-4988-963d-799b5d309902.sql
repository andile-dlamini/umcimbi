CREATE TABLE public.survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  survey_type text NOT NULL CHECK (survey_type IN ('planner_no_event', 'planner_no_vendor', 'vendor')),
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  whatsapp_number text,
  willing_to_call boolean NOT NULL DEFAULT false
);

GRANT INSERT ON public.survey_responses TO anon;
GRANT INSERT ON public.survey_responses TO authenticated;
GRANT ALL ON public.survey_responses TO service_role;

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert survey responses"
ON public.survey_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (true);