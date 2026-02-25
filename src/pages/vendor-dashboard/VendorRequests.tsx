import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { useVendorServiceRequests } from '@/hooks/useServiceRequests';
import { useVendorQuotes } from '@/hooks/useQuotes';
import { ServiceRequestCard } from '@/components/vendors/ServiceRequestCard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStartConversation } from '@/hooks/useChat';
import { toast } from 'sonner';

export default function VendorRequests() {
  const navigate = useNavigate();
  const { requests, isLoading, respondToRequest, declineRequest, refreshRequests } = useVendorServiceRequests();
  const { createQuote } = useVendorQuotes();
  const { startConversation } = useStartConversation();

  const newRequests = requests.filter(r => r.status === 'pending');
  const respondedRequests = requests.filter(r => r.status === 'quoted');
  const expiredOrDeclined = requests.filter(r => r.status === 'declined');

  const handleRespond = async (requestId: string, response: string, quotedAmount?: number) => {
    // Create a proper quote in addition to updating the request
    const request = requests.find(r => r.id === requestId);
    if (request && quotedAmount) {
      await createQuote({
        request_id: requestId,
        vendor_id: request.vendor_id,
        price: quotedAmount,
        notes: response,
      });
    }
    return respondToRequest(requestId, response, quotedAmount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Quote Requests" showBack />
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
      <PageHeader title="Quote Requests" showBack />
      
      <div className="p-4">
        {/* Open Chat - primary action */}
        <Button 
          onClick={() => navigate('/chats')}
          className="w-full mb-4"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Open Chats
        </Button>

        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="new" className="relative">
              New
              {newRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {newRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="responded">Responded</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
          </TabsList>
          
          <TabsContent value="new" className="mt-4 space-y-4">
            {newRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No new requests</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    New quote requests from clients will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              newRequests.map((request) => (
                <ServiceRequestCard
                  key={request.id}
                  request={request}
                  isVendorView
                  onRespond={handleRespond}
                  onDecline={(id) => declineRequest(id)}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="responded" className="mt-4 space-y-4">
            {respondedRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No responded requests</p>
                </CardContent>
              </Card>
            ) : (
              respondedRequests.map((request) => (
                <ServiceRequestCard
                  key={request.id}
                  request={request}
                  isVendorView
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="expired" className="mt-4 space-y-4">
            {expiredOrDeclined.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No expired or declined requests</p>
                </CardContent>
              </Card>
            ) : (
              expiredOrDeclined.map((request) => (
                <ServiceRequestCard
                  key={request.id}
                  request={request}
                  isVendorView
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Quote creation now happens in chat */}
      
      <BottomNav />
    </div>
  );
}
