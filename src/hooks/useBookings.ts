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
    // FIX 7: Set deposit_due_at on creation
    const dataWithTimestamps = {
      ...bookingData,
      deposit_due_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert(dataWithTimestamps as any)
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
    const updates: Record<string, any> = { [field]: status };
    
    if (field === 'deposit_status' && status === 'paid') {
      updates.booking_status = 'confirmed';
      updates.balance_status = 'due';
      updates.deposit_paid_at = new Date().toISOString();
      updates.balance_due_at = new Date().toISOString();
    }

    if (field === 'balance_status' && status === 'paid') {
      updates.balance_paid_at = new Date().toISOString();
      updates.booking_status = 'completed';
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

    // Post system message to conversation so both parties see the update
    try {
      // Get booking to find vendor_id
      const { data: bk } = await supabase
        .from('bookings')
        .select('vendor_id, client_id')
        .eq('id', bookingId)
        .single();
      if (bk && user) {
        const { data: conv } = await supabase
          .from('conversations')
          .select('id')
          .eq('user_id', bk.client_id)
          .eq('vendor_id', bk.vendor_id)
          .order('last_message_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (conv) {
          const label = field === 'deposit_status' ? 'Deposit' : 'Balance';
          await supabase.from('messages').insert({
            conversation_id: conv.id,
            sender_type: 'system' as any,
            sender_user_id: user.id,
            message_type: 'system',
            content: `💰 ${label} has been marked as paid.`,
          });
          await supabase.from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', conv.id);
        }
      }
    } catch (e) {
      console.error('Failed to post payment chat message:', e);
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
