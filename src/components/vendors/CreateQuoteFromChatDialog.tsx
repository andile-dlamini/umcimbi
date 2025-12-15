import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
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
import { Event, getEventTypeInfo } from '@/types/database';
import { sendChatNotification, notificationMessages } from '@/lib/chatNotifications';

interface CreateQuoteFromChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string; // The client user ID
  conversationEventId?: string | null; // Pre-selected event from conversation
}

export function CreateQuoteFromChatDialog({
  open,
  onOpenChange,
  userId,
  conversationEventId,
}: CreateQuoteFromChatDialogProps) {
  const { vendorProfile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(conversationEventId || '');
  const [quotedAmount, setQuotedAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  // Fetch user's events
  useEffect(() => {
    const fetchUserEvents = async () => {
      if (!userId) return;
      
      // We need to fetch events owned by this user
      // Since we can't directly query events by user_id due to RLS,
      // we'll use the conversation event or ask the vendor to specify details
      setIsLoadingEvents(true);
      
      // If there's a conversation event, use it
      if (conversationEventId) {
        const { data: event } = await supabase
          .from('events')
          .select('*')
          .eq('id', conversationEventId)
          .single();
        
        if (event) {
          setEvents([event as Event]);
          setSelectedEventId(event.id);
        }
      }
      
      setIsLoadingEvents(false);
    };

    if (open) {
      fetchUserEvents();
    }
  }, [userId, conversationEventId, open]);

  const handleSubmit = async () => {
    if (!vendorProfile || !quotedAmount || !message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // If no event selected but we have conversation event, use that
    const eventId = selectedEventId || conversationEventId;
    
    if (!eventId) {
      toast.error('No event associated with this conversation');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if a service request already exists
      const { data: existingRequest } = await supabase
        .from('service_requests')
        .select('id, status')
        .eq('event_id', eventId)
        .eq('vendor_id', vendorProfile.id)
        .eq('requester_user_id', userId)
        .maybeSingle();

      let requestId: string;

      if (existingRequest) {
        // Update existing request
        requestId = existingRequest.id;
        const { error: updateError } = await supabase
          .from('service_requests')
          .update({
            status: 'quoted',
            vendor_response: message,
            quoted_amount: parseFloat(quotedAmount),
            responded_at: new Date().toISOString(),
          })
          .eq('id', requestId);

        if (updateError) throw updateError;
      } else {
        // Create a new service request as 'quoted' directly
        const { data: newRequest, error: createError } = await supabase
          .from('service_requests')
          .insert({
            event_id: eventId,
            vendor_id: vendorProfile.id,
            requester_user_id: userId,
            status: 'quoted',
            vendor_response: message,
            quoted_amount: parseFloat(quotedAmount),
            responded_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (createError) throw createError;
        requestId = newRequest.id;
      }

      // Send chat notification to user
      await sendChatNotification(
        userId,
        vendorProfile.id,
        notificationMessages.quoteReceived(vendorProfile.name, parseFloat(quotedAmount)),
        eventId
      );

      toast.success('Quote sent successfully!');
      onOpenChange(false);
      setQuotedAmount('');
      setMessage('');
    } catch (error) {
      console.error('Error creating quote:', error);
      toast.error('Failed to send quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send a Quote</DialogTitle>
          <DialogDescription>
            Create a quote directly for this client
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Event info */}
          {selectedEvent && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium">{selectedEvent.name}</p>
              <p className="text-xs text-muted-foreground">
                {getEventTypeInfo(selectedEvent.type).shortLabel}
                {selectedEvent.date && ` • ${new Date(selectedEvent.date).toLocaleDateString()}`}
              </p>
            </div>
          )}

          {!selectedEvent && !isLoadingEvents && (
            <p className="text-sm text-muted-foreground">
              This conversation is not linked to a specific event. The quote will be sent as a general offer.
            </p>
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
            disabled={isSubmitting || !quotedAmount || !message.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Sending...' : 'Send Quote'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}