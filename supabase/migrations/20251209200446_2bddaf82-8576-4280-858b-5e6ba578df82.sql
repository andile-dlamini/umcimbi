-- Create vendor reviews table
CREATE TABLE public.vendor_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, user_id)
);

-- Enable RLS
ALTER TABLE public.vendor_reviews ENABLE ROW LEVEL SECURITY;

-- Users can view all reviews (public)
CREATE POLICY "Reviews are viewable by everyone"
ON public.vendor_reviews
FOR SELECT
USING (true);

-- Users can create reviews
CREATE POLICY "Users can create their own reviews"
ON public.vendor_reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.vendor_reviews
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.vendor_reviews
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update vendor rating
CREATE OR REPLACE FUNCTION public.update_vendor_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.vendors
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.vendor_reviews
      WHERE vendor_id = COALESCE(NEW.vendor_id, OLD.vendor_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.vendor_reviews
      WHERE vendor_id = COALESCE(NEW.vendor_id, OLD.vendor_id)
    )
  WHERE id = COALESCE(NEW.vendor_id, OLD.vendor_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to update rating on insert/update/delete
CREATE TRIGGER update_vendor_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.vendor_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_vendor_rating();

-- Add updated_at trigger
CREATE TRIGGER update_vendor_reviews_updated_at
BEFORE UPDATE ON public.vendor_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();