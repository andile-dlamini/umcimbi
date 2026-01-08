-- Add phone_verified column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN phone_verified boolean NOT NULL DEFAULT false;

-- Add index for quick lookups
CREATE INDEX idx_profiles_phone_verified ON public.profiles(phone_verified);