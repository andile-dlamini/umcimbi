import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Quote, QuoteWithDetails, CreateQuote, QuoteStatus } from '@/types/booking';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { sendChatNotification, notificationMessages } from '@/lib/chatNotifications';

// Hook for clients to view quotes on their requests
export function useClientQuotes(requestId?: string) {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<QuoteWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuotes = useCallback(async () => {
    if (!user) return;

    let query = supabase
      .from('quotes')
      .select(`
        *,
        vendor:vendors(id, name, category, rating, review_count, image_urls, business_verification_status, is_super_vendor, jobs_completed),
        request:service_requests(id, event_id, message, event_date)
      `)
      .order('created_at', { ascending: false });

    if (requestId) {
      query = query.eq('request_id', requestId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching quotes:', error);
    } else {
      setQuotes(data as unknown as QuoteWithDetails[]);
    }
    setIsLoading(false);
  }, [user, requestId]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const acceptQuote = async (quoteId: string): Promise<boolean> => {
    if (!user) return false;

    const quote = quotes.find(q => q.id === quoteId);

    try {
      // Call edge function to accept quote + generate PDF
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-final-offer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ quote_id: quoteId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Failed to accept quote');
        return false;
      }

      // Send chat notification to vendor
      if (quote?.request?.event_id) {
        const { data: event } = await supabase
          .from('events')
          .select('name')
          .eq('id', quote.request.event_id)
          .single();

        await sendChatNotification(
          user.id,
          quote.vendor_id,
          notificationMessages.quoteAccepted(event?.name || 'your event'),
          quote.request.event_id
        );
      }

      toast.success('Quote accepted! Final offer document generated.');
      await fetchQuotes();
      return true;
    } catch (err) {
      console.error('Error accepting quote:', err);
      toast.error('Failed to accept quote');
      return false;
    }
  };

  const declineQuote = async (quoteId: string): Promise<boolean> => {
    if (!user) return false;

    // Get quote details for notification
    const quote = quotes.find(q => q.id === quoteId);

    const { error } = await supabase
      .from('quotes')
      .update({ status: 'client_declined' as QuoteStatus })
      .eq('id', quoteId);

    if (error) {
      toast.error('Failed to decline quote');
      console.error('Error declining quote:', error);
      return false;
    }

    // Send chat notification to vendor
    if (quote) {
      await sendChatNotification(
        user.id,
        quote.vendor_id,
        notificationMessages.quoteDeclined(),
        quote.request?.event_id
      );
    }

    toast.success('Quote declined');
    await fetchQuotes();
    return true;
  };

  return {
    quotes,
    isLoading,
    acceptQuote,
    declineQuote,
    refreshQuotes: fetchQuotes,
  };
}

// Hook for vendors to manage quotes
export function useVendorQuotes() {
  const { vendorProfile, user } = useAuth();
  const [quotes, setQuotes] = useState<QuoteWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuotes = useCallback(async () => {
    if (!vendorProfile) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        request:service_requests(id, event_id, message, event_date, requester_user_id)
      `)
      .eq('vendor_id', vendorProfile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vendor quotes:', error);
    } else {
      setQuotes(data as unknown as QuoteWithDetails[]);
    }
    setIsLoading(false);
  }, [vendorProfile]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const createQuote = async (quoteData: CreateQuote): Promise<boolean> => {
    if (!vendorProfile || !user) return false;

    const { error } = await supabase.from('quotes').insert(quoteData);

    if (error) {
      toast.error('Failed to send quote');
      console.error('Error creating quote:', error);
      return false;
    }

    // Update the service request status
    await supabase
      .from('service_requests')
      .update({ status: 'quoted' })
      .eq('id', quoteData.request_id);

    // Get request details for notification
    const { data: request } = await supabase
      .from('service_requests')
      .select('requester_user_id, event_id')
      .eq('id', quoteData.request_id)
      .single();

    // Send chat notification to client (sender = vendor's owner user)
    if (request) {
      await sendChatNotification(
        request.requester_user_id,
        vendorProfile.id,
        notificationMessages.quoteReceived(vendorProfile.name, quoteData.price),
        request.event_id,
        user.id
      );
    }

    toast.success('Quote sent!');
    await fetchQuotes();
    return true;
  };

  return {
    quotes,
    isLoading,
    createQuote,
    refreshQuotes: fetchQuotes,
  };
}