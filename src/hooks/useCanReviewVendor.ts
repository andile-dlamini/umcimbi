import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface ReviewEligibility {
  canReview: boolean;
  hasExistingReview: boolean;
  completedBookingId: string | null;
  isLoading: boolean;
}

export function useCanReviewVendor(vendorId: string | undefined): ReviewEligibility {
  const { user } = useAuth();
  const [state, setState] = useState<ReviewEligibility>({
    canReview: false,
    hasExistingReview: false,
    completedBookingId: null,
    isLoading: true,
  });

  useEffect(() => {
    const checkEligibility = async () => {
      if (!user || !vendorId) {
        setState({
          canReview: false,
          hasExistingReview: false,
          completedBookingId: null,
          isLoading: false,
        });
        return;
      }

      // Check for completed bookings with this vendor
      const { data: completedBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id')
        .eq('client_id', user.id)
        .eq('vendor_id', vendorId)
        .eq('booking_status', 'completed')
        .limit(1);

      if (bookingsError) {
        console.error('Error checking bookings:', bookingsError);
        setState({
          canReview: false,
          hasExistingReview: false,
          completedBookingId: null,
          isLoading: false,
        });
        return;
      }

      const hasCompletedBooking = completedBookings && completedBookings.length > 0;
      const completedBookingId = hasCompletedBooking ? completedBookings[0].id : null;

      // Check if user already has a vendor review for this vendor
      const { data: existingReview, error: reviewError } = await supabase
        .from('vendor_reviews')
        .select('id')
        .eq('vendor_id', vendorId)
        .eq('user_id', user.id)
        .limit(1);

      if (reviewError) {
        console.error('Error checking existing review:', reviewError);
      }

      const hasExistingReview = existingReview && existingReview.length > 0;

      setState({
        canReview: hasCompletedBooking && !hasExistingReview,
        hasExistingReview: hasExistingReview || false,
        completedBookingId,
        isLoading: false,
      });
    };

    checkEligibility();
  }, [user, vendorId]);

  return state;
}
