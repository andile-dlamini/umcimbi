import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * The stored quote / order documents are HTML (despite the *_pdf_key column
 * names). Storage serves them without a content-disposition, and some
 * deployments downgrade the content type, so the browser can end up showing
 * raw source. Rendering the markup ourselves as a same-origin text/html blob
 * sidesteps whatever Storage would have sent.
 */
function renderDocument(win: Window | null, html: string, fallbackUrl: string): string {
  const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  if (win) {
    win.location.href = blobUrl;
  } else {
    window.location.href = blobUrl;
  }
  // Blob stays alive long enough for the tab to load it.
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  return fallbackUrl;
}

/**
 * Fetch the quote's final offer document and open it in a new tab.
 * Opens a blank tab SYNCHRONOUSLY (inside the user-gesture tap) before
 * awaiting the edge function, so mobile Safari / in-app browsers don't
 * silently block the popup.
 * Returns the signed URL on success, null on failure.
 */
export async function viewQuotePdfAction(quoteId: string): Promise<string | null> {
  const win = window.open('', '_blank', 'noopener,noreferrer');
  try {
    const { data, error } = await supabase.functions.invoke('get-final-offer-url', {
      body: { quote_id: quoteId },
    });

    if (error) {
      console.error('[VIEW_QUOTE] invoke error', error);
      if (win) win.close();
      toast.error("Couldn't open the quote");
      return null;
    }

    const url =
      typeof data === 'string'
        ? data
        : (data as any)?.url;

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      console.error('[VIEW_QUOTE] unexpected response shape', data);
      if (win) win.close();
      toast.error(typeof data === 'object' && data?.error ? data.error : "Couldn't open the quote");
      return null;
    }

    const html = typeof data === 'object' ? (data as any)?.html : null;
    if (typeof html === 'string' && html.length > 0) {
      return renderDocument(win, html, url);
    }

    // Fallback: hand the signed URL to the tab, exactly as before.
    if (win) {
      win.location.href = url;
    } else {
      window.location.href = url;
    }
    return url;
  } catch (err: any) {
    console.error('[VIEW_QUOTE] exception:', err);
    if (win) win.close();
    toast.error(err?.message || "Couldn't open the quote");
    return null;
  }
}

/**
 * Shared helpers for accepting / declining quotes.
 * Used by both MyQuotes page and chat QuoteCard so behaviour is identical.
 */

export async function acceptQuoteAction(quoteId: string): Promise<{ success: boolean; bookingId?: string }> {
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

    toast.success('Quote accepted! Pay deposit to confirm booking.');
    return { success: true, bookingId: data.booking_id };
  } catch (err: any) {
    console.error('[ACCEPT] exception:', err);
    toast.error(err?.message || 'Failed to accept quote');
    return { success: false };
  }
}

export async function declineQuoteAction(quoteId: string): Promise<boolean> {
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

    toast.info('Quote declined');
    return true;
  } catch (err: any) {
    console.error('[DECLINE] exception:', err);
    toast.error(err?.message || 'Failed to decline quote');
    return false;
  }
}

/**
 * Fetch the order confirmation document and open it in a new tab.
 * Opens a blank tab synchronously before awaiting the edge function to
 * survive mobile popup blockers.
 */
export async function viewOrderPdfAction(bookingId: string): Promise<string | null> {
  const win = window.open('', '_blank', 'noopener,noreferrer');
  try {
    const { data, error } = await supabase.functions.invoke('get-order-pdf-url', {
      body: { booking_id: bookingId },
    });

    if (error || data?.error) {
      if (win) win.close();
      toast.error(data?.error || "Couldn't open the order confirmation");
      return null;
    }

    const url = typeof data === 'string' ? data : data?.url;
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      if (win) win.close();
      toast.error("Couldn't open the order confirmation");
      return null;
    }

    const html = typeof data === 'object' ? (data as any)?.html : null;
    if (typeof html === 'string' && html.length > 0) {
      return renderDocument(win, html, url);
    }

    if (win) {
      win.location.href = url;
    } else {
      window.location.href = url;
    }
    return url;
  } catch (err: any) {
    if (win) win.close();
    toast.error(err?.message || "Couldn't open the order confirmation");
    return null;
  }
}
