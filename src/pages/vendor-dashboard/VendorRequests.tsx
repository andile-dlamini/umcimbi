import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';

import { useVendorServiceRequests } from '@/hooks/useServiceRequests';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStartConversation } from '@/hooks/useChat';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function VendorRequests() {
  const navigate = useNavigate();
  const { requests, isLoading } = useVendorServiceRequests();
  const { startConversation } = useStartConversation();

  const newRequests = requests.filter(r => r.status === 'pending');
  const respondedRequests = requests.filter(r => r.status === 'quoted');
  const pastRequests = requests.filter(r => ['declined', 'accepted', 'completed', 'cancelled'].includes(r.status));

  const handleOpenChat = async (userId: string, eventId?: string) => {
    // For vendor, we need the conversation between user and vendor
    // startConversation uses current user as user_id, but vendor needs to find existing conv
    navigate('/chats');
  };

  const renderRequest = (request: any) => (
    <Card key={request.id}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-foreground">{request.event?.name || 'Event'}</h3>
            <p className="text-xs text-muted-foreground">
              {request.requester_profile?.full_name || request.requester_profile?.phone_number || 'Unknown'}
            </p>
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
          <Button size="sm" variant="outline" onClick={() => navigate('/chats')}>
            <MessageCircle className="h-3.5 w-3.5 mr-1" />
            Open Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Requests Archive" showBack />
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Requests Archive" showBack />
      
      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-4">
          Read-only archive. All quoting happens in chat.
        </p>

        <Button onClick={() => navigate('/chats')} className="w-full mb-4">
          <MessageCircle className="h-4 w-4 mr-2" />
          Open Inbox
        </Button>

        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="new">
              New ({newRequests.length})
            </TabsTrigger>
            <TabsTrigger value="responded">Responded</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
          
          <TabsContent value="new" className="mt-4 space-y-3">
            {newRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No new requests</p>
                </CardContent>
              </Card>
            ) : newRequests.map(renderRequest)}
          </TabsContent>
          
          <TabsContent value="responded" className="mt-4 space-y-3">
            {respondedRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No responded requests</p>
                </CardContent>
              </Card>
            ) : respondedRequests.map(renderRequest)}
          </TabsContent>
          
          <TabsContent value="past" className="mt-4 space-y-3">
            {pastRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No past requests</p>
                </CardContent>
              </Card>
            ) : pastRequests.map(renderRequest)}
          </TabsContent>
        </Tabs>
      </div>
      
      
    </div>
  );
}
