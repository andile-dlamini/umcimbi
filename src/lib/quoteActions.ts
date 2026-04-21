import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/** Open a blob URL in a new tab, with anchor-click fallback for iframe contexts */
function openBlobUrl(blobUrl: string) {
  const win = window.open(blobUrl, '_blank', 'noopener,noreferrer');
  if (!win) {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

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
      console.error('[VIEW_PDF] invoke error', error);
      toast.error('Failed to load PDF');
      return null;
    }

    console.log('[VIEW_PDF] raw data', data, typeof data);

    const url =
      typeof data === 'string'
        ? data
        : (data as any)?.url;

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      console.error('[VIEW_PDF] unexpected response shape', data);
      toast.error(typeof data === 'object' && data?.error ? data.error : 'Could not load PDF');
      return null;
    }

    const fileRes = await fetch(url);
    if (!fileRes.ok) {
      console.error('[VIEW_PDF] fetch failed', fileRes.status);
      toast.error('Failed to download document');
      return null;
    }

    const htmlContent = await fileRes.text();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);

    openBlobUrl(blobUrl);
    return blobUrl;
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
      let msg = 'Failed to accept quote';
      try {
        const body = await (error as any)?.context?.json?.();
        msg = body?.error || error?.message || msg;
      } catch {
        msg = error?.message || msg;
      }
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

/**
 * Fetch a signed URL for the order confirmation PDF and open it.
 */
export async function viewOrderPdfAction(bookingId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('get-order-pdf-url', {
      body: { booking_id: bookingId },
    });

    if (error || data?.error) {
      toast.error(data?.error || 'Failed to load Order PDF');
      return null;
    }

    const url = typeof data === 'string' ? data : data?.url;
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      toast.error('Could not load Order PDF');
      return null;
    }

    const fileRes = await fetch(url);
    if (!fileRes.ok) {
      toast.error('Failed to download document');
      return null;
    }

    const htmlContent = await fileRes.text();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);

    openBlobUrl(blobUrl);
    return blobUrl;
  } catch (err: any) {
    toast.error(err?.message || 'Failed to load Order PDF');
    return null;
  }
}
