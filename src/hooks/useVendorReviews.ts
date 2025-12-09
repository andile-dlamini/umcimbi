import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface VendorReview {
  id: string;
  vendor_id: string;
  user_id: string;
  event_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export function useVendorReviews(vendorId: string | undefined) {
  const [reviews, setReviews] = useState<VendorReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchReviews = async () => {
    if (!vendorId) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('vendor_reviews')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
    } else {
      setReviews(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [vendorId]);

  const userReview = reviews.find(r => r.user_id === user?.id);

  const submitReview = async (rating: number, comment?: string) => {
    if (!user) {
      toast.error('Please log in to submit a review');
      return false;
    }

    if (!vendorId) return false;

    const reviewData = {
      vendor_id: vendorId,
      user_id: user.id,
      rating,
      comment: comment || null,
    };

    if (userReview) {
      // Update existing review
      const { error } = await supabase
        .from('vendor_reviews')
        .update({ rating, comment: comment || null })
        .eq('id', userReview.id);

      if (error) {
        console.error('Error updating review:', error);
        toast.error('Failed to update review');
        return false;
      }

      toast.success('Review updated!');
    } else {
      // Create new review
      const { error } = await supabase
        .from('vendor_reviews')
        .insert(reviewData);

      if (error) {
        console.error('Error submitting review:', error);
        toast.error('Failed to submit review');
        return false;
      }

      toast.success('Review submitted!');
    }

    await fetchReviews();
    return true;
  };

  const deleteReview = async () => {
    if (!userReview) return false;

    const { error } = await supabase
      .from('vendor_reviews')
      .delete()
      .eq('id', userReview.id);

    if (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
      return false;
    }

    toast.success('Review deleted');
    await fetchReviews();
    return true;
  };

  return {
    reviews,
    isLoading,
    userReview,
    submitReview,
    deleteReview,
    refreshReviews: fetchReviews,
  };
}
