import { useState, useEffect } from 'react';
import { Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { sendChatNotification, notificationMessages } from '@/lib/chatNotifications';
import { ConversationWithDetails } from '@/types/database';

interface CreateQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ClientOption {
  userId: string;
  name: string;
  email?: string;
  eventId?: string;
  eventName?: string;
}

export function CreateQuoteDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateQuoteDialogProps) {
  const { vendorProfile } = useAuth();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientUserId, setSelectedClientUserId] = useState<string>('');
  const [quotedAmount, setQuotedAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  // Fetch clients from existing conversations
  useEffect(() => {
    const fetchClients = async () => {
      if (!vendorProfile || !open) return;
      
      setIsLoadingClients(true);
      
      // Get conversations for this vendor
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          user_id,
          event_id,
          event:events(id, name, type)
        `)
        .eq('vendor_id', vendorProfile.id)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        setIsLoadingClients(false);
        return;
      }

      // Get profiles for these users
      const userIds = [...new Set(conversations?.map(c => c.user_id) || [])];
      const clientOptions: ClientOption[] = [];

      for (const conv of conversations || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, phone_number')
          .eq('user_id', conv.user_id)
          .single();

        const name = profile?.full_name || profile?.phone_number || profile?.email || 'Unknown user';
        const event = conv.event as { id: string; name: string; type: string } | null;
        
        clientOptions.push({
          userId: conv.user_id,
          name,
          email: profile?.email || undefined,
          eventId: event?.id,
          eventName: event?.name,
        });
      }

      // Deduplicate by unique user+event combination
      const uniqueClients = clientOptions.filter((client, index, self) =>
        index === self.findIndex(c => 
          c.userId === client.userId && c.eventId === client.eventId
        )
      );

      setClients(uniqueClients);
      setIsLoadingClients(false);
    };

    fetchClients();
  }, [vendorProfile, open]);

  const selectedClient = clients.find(c => 
    `${c.userId}-${c.eventId || 'no-event'}` === selectedClientUserId
  );

  const handleSubmit = async () => {
    if (!vendorProfile || !selectedClient || !quotedAmount || !message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!selectedClient.eventId) {
      toast.error('Selected client has no associated event');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if a service request already exists
      const { data: existingRequest } = await supabase
        .from('service_requests')
        .select('id, status')
        .eq('event_id', selectedClient.eventId)
        .eq('vendor_id', vendorProfile.id)
        .eq('requester_user_id', selectedClient.userId)
        .maybeSingle();

      if (existingRequest) {
        // Update existing request
        const { error: updateError } = await supabase
          .from('service_requests')
          .update({
            status: 'quoted',
            vendor_response: message,
            quoted_amount: parseFloat(quotedAmount),
            responded_at: new Date().toISOString(),
          })
          .eq('id', existingRequest.id);

        if (updateError) throw updateError;
      } else {
        // Create a new service request as 'quoted' directly
        const { error: createError } = await supabase
          .from('service_requests')
          .insert({
            event_id: selectedClient.eventId,
            vendor_id: vendorProfile.id,
            requester_user_id: selectedClient.userId,
            status: 'quoted',
            vendor_response: message,
            quoted_amount: parseFloat(quotedAmount),
            responded_at: new Date().toISOString(),
          });

        if (createError) throw createError;
      }

      // Send chat notification to user
      await sendChatNotification(
        selectedClient.userId,
        vendorProfile.id,
        notificationMessages.quoteReceived(vendorProfile.name, parseFloat(quotedAmount)),
        selectedClient.eventId
      );

      toast.success('Quote sent successfully!');
      onOpenChange(false);
      setQuotedAmount('');
      setMessage('');
      setSelectedClientUserId('');
      onSuccess?.();
    } catch (error) {
      console.error('Error creating quote:', error);
      toast.error('Failed to send quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Quote</DialogTitle>
          <DialogDescription>
            Send a quote to a client you've chatted with
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Client selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Select Client & Event *</Label>
            {isLoadingClients ? (
              <p className="text-sm text-muted-foreground">Loading clients...</p>
            ) : clients.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No clients found. Start a conversation with a user first.
              </p>
            ) : (
              <Select value={selectedClientUserId} onValueChange={setSelectedClientUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.filter(c => c.eventId).map((client) => (
                    <SelectItem 
                      key={`${client.userId}-${client.eventId || 'no-event'}`}
                      value={`${client.userId}-${client.eventId || 'no-event'}`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{client.name}</span>
                        {client.eventName && (
                          <span className="text-muted-foreground">
                            • {client.eventName}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected client info */}
          {selectedClient && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium">{selectedClient.name}</p>
              {selectedClient.email && (
                <p className="text-xs text-muted-foreground">{selectedClient.email}</p>
              )}
              {selectedClient.eventName && (
                <p className="text-xs text-primary mt-1">Event: {selectedClient.eventName}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Quoted Amount (R) *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g. 5000"
              value={quotedAmount}
              onChange={(e) => setQuotedAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Include what's covered, availability, terms..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !selectedClientUserId || !quotedAmount || !message.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Sending...' : 'Send Quote'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}