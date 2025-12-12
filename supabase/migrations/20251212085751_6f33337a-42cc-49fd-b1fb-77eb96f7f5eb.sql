-- Add latitude and longitude columns to events table
ALTER TABLE public.events 
ADD COLUMN latitude double precision,
ADD COLUMN longitude double precision;

-- Add latitude and longitude columns to vendors table
ALTER TABLE public.vendors 
ADD COLUMN latitude double precision,
ADD COLUMN longitude double precision;