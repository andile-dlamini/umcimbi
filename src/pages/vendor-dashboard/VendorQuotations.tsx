import { PageHeader } from '@/components/layout/PageHeader';
import { useVendorQuotes } from '@/hooks/useQuotes';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, MessageCircle, Banknote } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { quoteStatusConfig } from '@/lib/statusConfig';
import { viewQuotePdfAction } from '@/lib/quoteActions';
import { useState } from 'react';
import { QuoteWithDetails } from '@/types/booking';

function VendorQuoteCard({ quote }: { quote: QuoteWithDetails }) {
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const navigate = useNavigate();
  const status = quoteStatusConfig[quote.status];
  const isExpired = quote.expires_at ? new Date(quote.expires_at) < new Date() : false;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-foreground">
              {quote.request?.message?.slice(0, 60) || 'Quote'}
              {(quote.request?.message?.length || 0) > 60 ? '…' : ''}
            </h3>
            {quote.offer_number && (
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {quote.offer_number}
              </p>
            )}
          </div>
          <Badge className={isExpired && quote.status === 'pending_client' ? 'bg-muted text-muted-foreground' : status.className}>
            {isExpired && quote.status === 'pending_client' ? 'Expired' : status.label}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-lg font-bold text-foreground">
         <Banknote className="h-5 w-5" />
          <span>R{quote.price.toLocaleString()}</span>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          Sent {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0 gap-2">
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

export default function VendorQuotations() {
  const { quotes, isLoading } = useVendorQuotes();

  const pendingQuotes = quotes.filter(q => q.status === 'pending_client');
  const acceptedQuotes = quotes.filter(q => q.status === 'client_accepted');
  const declinedOrExpired = quotes.filter(q =>
    q.status === 'client_declined' || q.status === 'expired'
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Quotations" showBack />
        <div className="p-4 space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Quotations" showBack />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Pending ({pendingQuotes.length})
            </TabsTrigger>
            <TabsTrigger value="accepted">
              Accepted ({acceptedQuotes.length})
            </TabsTrigger>
            <TabsTrigger value="other">
              Other ({declinedOrExpired.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4 space-y-3">
            {pendingQuotes.length === 0 ? (
              <Card><CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No pending quotes</p>
              </CardContent></Card>
            ) : pendingQuotes.map(q => <VendorQuoteCard key={q.id} quote={q} />)}
          </TabsContent>

          <TabsContent value="accepted" className="mt-4 space-y-3">
            {acceptedQuotes.length === 0 ? (
              <Card><CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No accepted quotes yet</p>
              </CardContent></Card>
            ) : acceptedQuotes.map(q => <VendorQuoteCard key={q.id} quote={q} />)}
          </TabsContent>

          <TabsContent value="other" className="mt-4 space-y-3">
            {declinedOrExpired.length === 0 ? (
              <Card><CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No declined or expired quotes</p>
              </CardContent></Card>
            ) : declinedOrExpired.map(q => <VendorQuoteCard key={q.id} quote={q} />)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
