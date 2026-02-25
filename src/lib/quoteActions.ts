import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Fetch a signed URL for the quote's final offer PDF and open it.
 * Returns the URL on success, null on failure.
 */
export async function viewQuotePdfAction(quoteId: string): Promise<string | null> {
  console.log('[VIEW_PDF] clicked', quoteId);
  try {
    const { data, error } = await supabase.functions.invoke('get-final-offer-url', {
      body: { quote_id: quoteId },
    });

    if (error) {
      console.error('[VIEW_PDF] invoke error:', { error, data });
      toast.error(data?.error || error?.message || 'Failed to load PDF');
      return null;
    }
    if (data?.error) {
      console.error('[VIEW_PDF] server error:', data.error);
      toast.error(data.error);
      return null;
    }
    if (!data?.url) {
      console.error('[VIEW_PDF] no URL in response:', data);
      toast.error('Could not load PDF');
      return null;
    }

    console.log('[VIEW_PDF] success, opening URL');
    window.open(data.url, '_blank');
    return data.url;
  } catch (err: any) {
    console.error('[VIEW_PDF] exception:', err);
    toast.error(err?.message || 'Failed to load PDF');
    return null;
  }
}

/**
 * Shared helpers for accepting / declining quotes.
 * Used by both MyQuotes page and chat QuoteCard so behaviour is identical.
 */

export async function acceptQuoteAction(quoteId: string): Promise<{ success: boolean; bookingId?: string }> {
  console.log('[ACCEPT] clicked', quoteId);
  try {
    const { data, error } = await supabase.functions.invoke('accept-quote', {
      body: { quote_id: quoteId },
    });

    if (error) {
      const msg = data?.error || error?.message || 'Failed to accept quote';
      console.error('[ACCEPT] invoke error:', { error, data });
      toast.error(msg);
      return { success: false };
    }
    if (data?.error) {
      console.error('[ACCEPT] server error:', data.error);
      toast.error(data.error);
      return { success: false };
    }

    console.log('[ACCEPT] success', data);
    toast.success('Quote accepted! Pay deposit to confirm booking.');
    return { success: true, bookingId: data.booking_id };
  } catch (err: any) {
    console.error('[ACCEPT] exception:', err);
    toast.error(err?.message || 'Failed to accept quote');
    return { success: false };
  }
}

export async function declineQuoteAction(quoteId: string): Promise<boolean> {
  console.log('[DECLINE] clicked', quoteId);
  try {
    const { data, error } = await supabase.functions.invoke('decline-quote', {
      body: { quote_id: quoteId },
    });

    if (error) {
      const msg = data?.error || error?.message || 'Failed to decline quote';
      console.error('[DECLINE] invoke error:', { error, data });
      toast.error(msg);
      return false;
    }
    if (data?.error) {
      console.error('[DECLINE] server error:', data.error);
      toast.error(data.error);
      return false;
    }

    console.log('[DECLINE] success', data);
    toast.info('Quote declined');
    return true;
  } catch (err: any) {
    console.error('[DECLINE] exception:', err);
    toast.error(err?.message || 'Failed to decline quote');
    return false;
  }
}
