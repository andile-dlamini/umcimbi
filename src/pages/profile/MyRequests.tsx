import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { useMyServiceRequests } from '@/hooks/useServiceRequests';
import { ServiceRequestCard } from '@/components/vendors/ServiceRequestCard';

export default function MyRequests() {
  const { requests, isLoading, cancelRequest, acceptQuote, declineQuote } = useMyServiceRequests();

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const quotedRequests = requests.filter(r => r.status === 'quoted');
  const activeRequests = requests.filter(r => r.status === 'accepted');
  const pastRequests = requests.filter(r => ['completed', 'declined', 'cancelled'].includes(r.status));

  return (
    <div className="min-h-screen pb-safe bg-background">
      <PageHeader title="My Quote Requests" showBack />

      <div className="px-4 py-6 max-w-lg mx-auto">
        <Tabs defaultValue="pending">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" className="relative text-xs">
              Pending
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-accent-foreground rounded-full text-[10px] flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="quoted" className="relative text-xs">
              Quoted
              {quotedRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center">
                  {quotedRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
            <TabsTrigger value="past" className="text-xs">Past</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4 space-y-3">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-6">Loading...</p>
            ) : pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No pending requests</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Browse vendors and request quotes
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map((request) => (
                <ServiceRequestCard
                  key={request.id}
                  request={request}
                  onCancel={cancelRequest}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="quoted" className="mt-4 space-y-3">
            {quotedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No quotes received</p>
                </CardContent>
              </Card>
            ) : (
              quotedRequests.map((request) => (
                <ServiceRequestCard
                  key={request.id}
                  request={request}
                  onAccept={acceptQuote}
                  onDecline={async (id) => {
                    await declineQuote(id);
                    return true;
                  }}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-4 space-y-3">
            {activeRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No active bookings</p>
                </CardContent>
              </Card>
            ) : (
              activeRequests.map((request) => (
                <ServiceRequestCard
                  key={request.id}
                  request={request}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4 space-y-3">
            {pastRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No past requests</p>
                </CardContent>
              </Card>
            ) : (
              pastRequests.map((request) => (
                <ServiceRequestCard
                  key={request.id}
                  request={request}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}