import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Booking, BookingWithDetails, CreateBooking, BookingStatus, PaymentStatus, DeliveryProof, BookingReview } from '@/types/booking';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// Hook for clients to manage their bookings
export function useClientBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        vendor:vendors(id, name, category, rating, image_urls, phone_number, whatsapp_number),
        event:events(id, name, date, location)
      `)
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
    } else {
      setBookings(data as unknown as BookingWithDetails[]);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const createBooking = async (bookingData: CreateBooking): Promise<Booking | null> => {
    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (error) {
      toast.error('Failed to create booking');
      console.error('Error creating booking:', error);
      return null;
    }

    toast.success('Booking created!');
    await fetchBookings();
    return data as Booking;
  };

  const updatePaymentStatus = async (
    bookingId: string,
    field: 'deposit_status' | 'balance_status',
    status: PaymentStatus
  ): Promise<boolean> => {
    const updates: Record<string, PaymentStatus | BookingStatus> = { [field]: status };
    
    // If deposit is paid, mark booking as confirmed
    if (field === 'deposit_status' && status === 'paid') {
      updates.booking_status = 'confirmed';
      updates.balance_status = 'due';
    }

    const { error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId);

    if (error) {
      toast.error('Failed to update payment status');
      console.error('Error updating payment:', error);
      return false;
    }

    toast.success('Payment status updated!');
    await fetchBookings();
    return true;
  };

  const markAsCompleted = async (bookingId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('bookings')
      .update({ booking_status: 'completed' as BookingStatus })
      .eq('id', bookingId);

    if (error) {
      toast.error('Failed to mark as completed');
      console.error('Error completing booking:', error);
      return false;
    }

    toast.success('Booking marked as completed!');
    await fetchBookings();
    return true;
  };

  const reportProblem = async (bookingId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('bookings')
      .update({ booking_status: 'disputed' as BookingStatus })
      .eq('id', bookingId);

    if (error) {
      toast.error('Failed to report problem');
      console.error('Error reporting problem:', error);
      return false;
    }

    toast.success('Problem reported');
    await fetchBookings();
    return true;
  };

  return {
    bookings,
    isLoading,
    createBooking,
    updatePaymentStatus,
    markAsCompleted,
    reportProblem,
    refreshBookings: fetchBookings,
  };
}

// Hook for vendors to manage bookings
export function useVendorBookings() {
  const { vendorProfile } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!vendorProfile) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        event:events(id, name, date, location)
      `)
      .eq('vendor_id', vendorProfile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vendor bookings:', error);
    } else {
      setBookings(data as unknown as BookingWithDetails[]);
    }
    setIsLoading(false);
  }, [vendorProfile]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const markJobCompleted = async (bookingId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('bookings')
      .update({ booking_status: 'completed' as BookingStatus })
      .eq('id', bookingId);

    if (error) {
      toast.error('Failed to mark job as completed');
      console.error('Error completing job:', error);
      return false;
    }

    toast.success('Job marked as completed!');
    await fetchBookings();
    return true;
  };

  return {
    bookings,
    isLoading,
    markJobCompleted,
    refreshBookings: fetchBookings,
  };
}

// Hook for a single booking with all details
export function useBookingDetails(bookingId: string | undefined) {
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [deliveryProofs, setDeliveryProofs] = useState<DeliveryProof[]>([]);
  const [reviews, setReviews] = useState<BookingReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    if (!bookingId || !user) {
      setIsLoading(false);
      return;
    }

    // Fetch booking
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        vendor:vendors(id, name, category, rating, image_urls, phone_number, whatsapp_number),
        event:events(id, name, date, location)
      `)
      .eq('id', bookingId)
      .maybeSingle();

    if (bookingError) {
      console.error('Error fetching booking:', bookingError);
    } else {
      setBooking(bookingData as unknown as BookingWithDetails);
    }

    // Fetch delivery proofs
    const { data: proofsData } = await supabase
      .from('delivery_proofs')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });

    if (proofsData) {
      setDeliveryProofs(proofsData as DeliveryProof[]);
    }

    // Fetch reviews
    const { data: reviewsData } = await supabase
      .from('booking_reviews')
      .select('*')
      .eq('booking_id', bookingId);

    if (reviewsData) {
      setReviews(reviewsData as BookingReview[]);
    }

    setIsLoading(false);
  }, [bookingId, user]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const uploadDeliveryProof = async (photos: string[], notes?: string): Promise<boolean> => {
    if (!user || !bookingId) return false;

    const { error } = await supabase.from('delivery_proofs').insert({
      booking_id: bookingId,
      uploaded_by: user.id,
      photos,
      notes,
    });

    if (error) {
      toast.error('Failed to upload proof');
      console.error('Error uploading proof:', error);
      return false;
    }

    toast.success('Delivery proof uploaded!');
    await fetchDetails();
    return true;
  };

  const submitReview = async (rating: number, comment?: string, reviewedPartyId?: string): Promise<boolean> => {
    if (!user || !bookingId || !booking) return false;

    const isVendor = booking.vendor?.id === user.id;
    
    const { error } = await supabase.from('booking_reviews').insert({
      booking_id: bookingId,
      reviewer_type: isVendor ? 'vendor' : 'client',
      reviewer_id: user.id,
      reviewed_party_id: reviewedPartyId || (isVendor ? booking.client_id : booking.vendor_id),
      rating,
      comment,
    });

    if (error) {
      if (error.code === '23505') {
        toast.error('You have already submitted a review');
      } else {
        toast.error('Failed to submit review');
        console.error('Error submitting review:', error);
      }
      return false;
    }

    toast.success('Review submitted!');
    await fetchDetails();
    return true;
  };

  return {
    booking,
    deliveryProofs,
    reviews,
    isLoading,
    uploadDeliveryProof,
    submitReview,
    refreshDetails: fetchDetails,
  };
}
