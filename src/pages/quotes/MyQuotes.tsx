import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { useClientQuotes } from '@/hooks/useQuotes';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, Clock, Star, CheckCircle, XCircle, FileText, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { QuoteWithDetails } from '@/types/booking';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { quoteStatusConfig } from '@/lib/statusConfig';
import { acceptQuoteAction, declineQuoteAction } from '@/lib/quoteActions';

const statusConfig = quoteStatusConfig;

function QuoteCard({ 
  quote, 
  onAccept, 
  onDecline 
}: { 
  quote: QuoteWithDetails; 
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
}) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const isAccepted = quote.status === 'client_accepted';
  const status = statusConfig[quote.status];
  const isExpired = new Date(quote.expires_at) < new Date();
  const isPending = quote.status === 'pending_client' && !isExpired;

  const handleAccept = async () => {
    setIsAccepting(true);
    await onAccept();
    setIsAccepting(false);
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    await onDecline();
    setIsDeclining(false);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            {quote.vendor?.image_urls?.[0] && (
              <img 
                src={quote.vendor.image_urls[0]} 
                alt={quote.vendor.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <h3 className="font-semibold text-foreground">{quote.vendor?.name}</h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{quote.vendor?.rating?.toFixed(1) || 'New'}</span>
              </div>
            </div>
          </div>
          <Badge className={isExpired && quote.status === 'pending_client' ? 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700' : status.className}>
            {isExpired && quote.status === 'pending_client' ? 'Expired' : status.label}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-lg font-bold text-foreground">
            <DollarSign className="h-5 w-5" />
            <span>R{quote.price.toLocaleString()}</span>
          </div>
          
          {quote.notes && (
            <p className="text-sm text-muted-foreground">{quote.notes}</p>
          )}
          
          {quote.proposed_date_time_window && (
            <p className="text-sm text-muted-foreground">
              Available: {quote.proposed_date_time_window}
            </p>
          )}
          
          {isPending && (
            <div className="flex items-center gap-2 text-sm text-warning">
              <Clock className="h-4 w-4" />
              <span>Expires {formatDistanceToNow(new Date(quote.expires_at), { addSuffix: true })}</span>
            </div>
          )}
       </div>
      </CardContent>
      
      {isPending && (
        <CardFooter className="p-4 pt-0 gap-2">
          <Button 
            type="button"
            variant="outline" 
            className="flex-1"
            onClick={handleDecline}
            disabled={isDeclining}
          >
            <XCircle className="h-4 w-4 mr-2" />
            {isDeclining ? 'Declining...' : 'Decline'}
          </Button>
          <Button 
            type="button"
            className="flex-1"
            onClick={handleAccept}
            disabled={isAccepting}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isAccepting ? 'Accepting...' : 'Accept & Book'}
          </Button>
        </CardFooter>
      )}

      {isAccepted && quote.final_offer_pdf_key && (
        <CardFooter className="p-4 pt-0 gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={isLoadingPdf}
            onClick={async () => {
              setIsLoadingPdf(true);
              try {
                const { data: sessionData } = await supabase.auth.getSession();
                const token = sessionData?.session?.access_token;
                const res = await fetch(
                  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-final-offer-url?quote_id=${quote.id}`,
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                    },
                  }
                );
                const data = await res.json();
                if (data.url) window.open(data.url, '_blank');
                else toast.error('Could not load document');
              } catch { toast.error('Failed to load document'); }
              finally { setIsLoadingPdf(false); }
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            {isLoadingPdf ? 'Loading...' : 'View Final Offer'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={isLoadingPdf}
            onClick={async () => {
              setIsLoadingPdf(true);
              try {
                const { data: sessionData } = await supabase.auth.getSession();
                const token = sessionData?.session?.access_token;
                const res = await fetch(
                  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-final-offer-url?quote_id=${quote.id}`,
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                    },
                  }
                );
                const data = await res.json();
                if (data.url) {
                  const a = document.createElement('a');
                  a.href = data.url;
                  a.download = `${data.offer_number || 'final-offer'}.html`;
                  a.click();
                } else toast.error('Could not load document');
              } catch { toast.error('Failed to download'); }
              finally { setIsLoadingPdf(false); }
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </CardFooter>
      )}

      {isAccepted && quote.offer_number && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground">
            Offer #{quote.offer_number}
          </p>
        </div>
      )}
    </Card>
  );
}

export default function MyQuotes() {
  const { quotes, isLoading, refreshQuotes } = useClientQuotes();
  const navigate = useNavigate();

  const pendingQuotes = quotes.filter(q => q.status === 'pending_client');
  const decidedQuotes = quotes.filter(q => q.status !== 'pending_client');

  const handleAcceptQuote = async (quote: QuoteWithDetails) => {
    const result = await acceptQuoteAction(quote.id);
    if (result.success) {
      await refreshQuotes();
      if (result.bookingId) {
        navigate(`/bookings/${result.bookingId}`);
      }
    }
  };

  const handleDeclineQuote = async (quote: QuoteWithDetails) => {
    const success = await declineQuoteAction(quote.id);
    if (success) {
      await refreshQuotes();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="My Quotes" showBack />
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="My Quotes" showBack />
      
      <div className="p-4 space-y-6">
        {quotes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No quotes yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Send quote requests to vendors to receive quotes
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {pendingQuotes.length > 0 && (
              <div>
                <h2 className="font-semibold text-lg mb-3">Awaiting Your Decision</h2>
                <div className="space-y-4">
                  {pendingQuotes.map((quote) => (
                    <QuoteCard
                      key={quote.id}
                      quote={quote}
                      onAccept={() => handleAcceptQuote(quote)}
                      onDecline={() => handleDeclineQuote(quote)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {decidedQuotes.length > 0 && (
              <div>
                <h2 className="font-semibold text-lg mb-3">Past Quotes</h2>
                <div className="space-y-4">
                  {decidedQuotes.map((quote) => (
                    <QuoteCard
                      key={quote.id}
                      quote={quote}
                      onAccept={() => handleAcceptQuote(quote)}
                      onDecline={() => handleDeclineQuote(quote)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}
