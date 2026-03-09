ALTER TYPE public.quote_status ADD VALUE IF NOT EXISTS 'adjustment_requested';

ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS adjustment_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS adjustment_reason text;