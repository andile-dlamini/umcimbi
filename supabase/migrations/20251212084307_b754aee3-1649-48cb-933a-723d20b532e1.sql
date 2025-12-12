-- Add estimated_budget column to events table
ALTER TABLE public.events 
ADD COLUMN estimated_budget numeric DEFAULT 0;