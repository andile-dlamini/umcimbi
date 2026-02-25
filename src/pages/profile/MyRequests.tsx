import { FileText, Clock, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { useMyServiceRequests } from '@/hooks/useServiceRequests';
import { useStartConversation } from '@/hooks/useChat';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function MyRequests() {
  const { requests, isLoading } = useMyServiceRequests();
  const { startConversation } = useStartConversation();
  const navigate = useNavigate();

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const quotedRequests = requests.filter(r => r.status === 'quoted');
  const pastRequests = requests.filter(r => ['completed', 'declined', 'cancelled', 'accepted'].includes(r.status));

  const handleOpenChat = async (vendorId: string, eventId?: string) => {
    const convId = await startConversation(vendorId, eventId);
    if (convId) {
      navigate(`/chat/${convId}`);
    } else {
      toast.error('Could not open chat');
    }
  };

  const renderRequest = (request: any) => (
    <Card key={request.id}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-foreground">{request.vendor?.name || 'Vendor'}</h3>
            <p className="text-xs text-muted-foreground">{request.event?.name}</p>
          </div>
          <Badge variant="outline" className="capitalize text-xs">{request.status}</Badge>
        </div>
        {request.message && (
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{request.message}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {format(new Date(request.created_at), 'dd MMM yyyy')}
          </span>
          <Button size="sm" variant="outline" onClick={() => handleOpenChat(request.vendor_id, request.event_id)}>
            <MessageCircle className="h-3.5 w-3.5 mr-1" />
            Open Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen pb-safe bg-background">
      <PageHeader title="Requests Archive" showBack />

      <div className="px-4 py-6 max-w-lg mx-auto">
        <p className="text-sm text-muted-foreground mb-4">
          Read-only archive of your quote requests. All actions happen in chat.
        </p>
        <Tabs defaultValue="pending">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="text-xs">
              Pending ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="quoted" className="text-xs">
              Quoted ({quotedRequests.length})
            </TabsTrigger>
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
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map(renderRequest)
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
              quotedRequests.map(renderRequest)
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
              pastRequests.map(renderRequest)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
