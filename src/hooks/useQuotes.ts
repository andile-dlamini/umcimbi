import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Quote, QuoteWithDetails, CreateQuote, QuoteStatus } from '@/types/booking';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

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
        vendor:vendors(id, name, category, rating, image_urls),
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
    const { error } = await supabase
      .from('quotes')
      .update({ status: 'client_accepted' as QuoteStatus })
      .eq('id', quoteId);

    if (error) {
      toast.error('Failed to accept quote');
      console.error('Error accepting quote:', error);
      return false;
    }

    // Decline other quotes for the same request
    const quote = quotes.find(q => q.id === quoteId);
    if (quote) {
      await supabase
        .from('quotes')
        .update({ status: 'client_declined' as QuoteStatus })
        .eq('request_id', quote.request_id)
        .neq('id', quoteId);
    }

    toast.success('Quote accepted!');
    await fetchQuotes();
    return true;
  };

  const declineQuote = async (quoteId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('quotes')
      .update({ status: 'client_declined' as QuoteStatus })
      .eq('id', quoteId);

    if (error) {
      toast.error('Failed to decline quote');
      console.error('Error declining quote:', error);
      return false;
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
  const { vendorProfile } = useAuth();
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
        request:service_requests(id, event_id, message, event_date)
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
