import { PageHeader } from '@/components/layout/PageHeader';

import { useClientQuotes } from '@/hooks/useQuotes';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Banknote, Clock, Star, FileText, MessageCircle, BarChart3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { QuoteWithDetails } from '@/types/booking';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quoteStatusConfig } from '@/lib/statusConfig';
import { viewQuotePdfAction } from '@/lib/quoteActions';
import { useStartConversation } from '@/hooks/useChat';
import { toast } from 'sonner';

const statusConfig = quoteStatusConfig;

function QuoteCard({ quote }: { quote: QuoteWithDetails }) {
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const navigate = useNavigate();
  const { startConversation } = useStartConversation();
  const status = statusConfig[quote.status];
  const isExpired = new Date(quote.expires_at) < new Date();

  const handleOpenChat = async () => {
    if (!quote.vendor?.id) return;
    const convId = await startConversation(quote.vendor.id);
    if (convId) {
      navigate(`/chat/${convId}`);
    } else {
      toast.error('Could not open chat');
    }
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
            <Banknote className="h-5 w-5" />
            <span>R{quote.price.toLocaleString()}</span>
          </div>
          
          {quote.notes && (
            <p className="text-sm text-muted-foreground">{quote.notes}</p>
          )}

          {quote.offer_number && (
            <p className="text-xs text-muted-foreground font-mono">
              Ref: {quote.offer_number}
            </p>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={handleOpenChat}>
          <MessageCircle className="h-4 w-4 mr-2" />
          Open Chat
        </Button>
        {quote.final_offer_pdf_key && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={isLoadingPdf}
            onClick={async () => {
              setIsLoadingPdf(true);
              await viewQuotePdfAction(quote.id);
              setIsLoadingPdf(false);
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            {isLoadingPdf ? 'Loading...' : 'View PDF'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function MyQuotes() {
  const { quotes, isLoading } = useClientQuotes();
  const navigate = useNavigate();

  const pendingQuotes = quotes.filter(q => q.status === 'pending_client');
  const acceptedQuotes = quotes.filter(q => q.status === 'client_accepted');
  const otherQuotes = quotes.filter(q =>
    q.status === 'client_declined' || q.status === 'expired'
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Quotations" />
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Quotations" />
      
      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            All your quotations in one place.
          </p>
          {quotes.length >= 2 && (
            <Button variant="outline" size="sm" onClick={() => navigate('/quotes/compare')}>
              <BarChart3 className="h-4 w-4 mr-1.5" />
              Compare
            </Button>
          )}
        </div>

        {quotes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No quotations yet</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">Pending ({pendingQuotes.length})</TabsTrigger>
              <TabsTrigger value="accepted">Accepted ({acceptedQuotes.length})</TabsTrigger>
              <TabsTrigger value="other">Other ({otherQuotes.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4 space-y-3">
              {pendingQuotes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No pending quotations</p>
              ) : pendingQuotes.map(q => <QuoteCard key={q.id} quote={q} />)}
            </TabsContent>

            <TabsContent value="accepted" className="mt-4 space-y-3">
              {acceptedQuotes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No accepted quotations</p>
              ) : acceptedQuotes.map(q => <QuoteCard key={q.id} quote={q} />)}
            </TabsContent>

            <TabsContent value="other" className="mt-4 space-y-3">
              {otherQuotes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No declined or expired quotations</p>
              ) : otherQuotes.map(q => <QuoteCard key={q.id} quote={q} />)}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
