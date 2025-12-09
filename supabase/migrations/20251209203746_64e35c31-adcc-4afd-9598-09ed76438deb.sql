-- Add new event types to the event_type enum
ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'imbeleko';
ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'family_introduction';
ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'lobola';
ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'umbondo';
ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'umemulo';
ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'funeral';
ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'ancestral_ritual';

-- Add new budget categories to the budget_category enum
ALTER TYPE public.budget_category ADD VALUE IF NOT EXISTS 'funeral_services';
ALTER TYPE public.budget_category ADD VALUE IF NOT EXISTS 'healer_services';
ALTER TYPE public.budget_category ADD VALUE IF NOT EXISTS 'music';