import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useEvents } from '@/hooks/useEvents';
import { useMyServiceRequests } from '@/hooks/useServiceRequests';
import { Vendor, EventType, EVENT_TYPES, getEventTypeInfo } from '@/types/database';
import { format } from 'date-fns';
import { z } from 'zod';

const quoteRequestSchema = z.object({
  guestCount: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    const num = parseInt(val);
    return !isNaN(num) && num >= 1 && num <= 10000;
  }, { message: 'Guest count must be between 1 and 10,000' }),
  budgetRange: z.string().max(50, 'Budget range must be less than 50 characters').optional(),
  message: z.string().max(2000, 'Message must be less than 2,000 characters').optional(),
});
interface RequestQuoteDialogProps {
  vendor: Vendor;
  children: React.ReactNode;
}

const NEW_EVENT = '__new__';

export function RequestQuoteDialog({ vendor, children }: RequestQuoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [message, setMessage] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [newEventType, setNewEventType] = useState<EventType | ''>('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { events, createEvent } = useEvents();
  const { createRequest } = useMyServiceRequests();

  const isNewEvent = selectedEventId === NEW_EVENT;
  const selectedEvent = events.find(e => e.id === selectedEventId);

  const handleSubmit = async () => {
    if (!selectedEventId) return;
    if (isNewEvent && !newEventType) return;

    // Validate inputs
    const result = quoteRequestSchema.safeParse({
      guestCount,
      budgetRange: budgetRange.trim(),
      message: message.trim(),
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setIsSubmitting(true);

    let eventId = selectedEventId;
    let requestDate = selectedEvent?.date || null;

    if (isNewEvent) {
      const parsedGuests = guestCount ? parseInt(guestCount) : NaN;
      const guests = !isNaN(parsedGuests) ? parsedGuests : 50;
      const typeInfo = getEventTypeInfo(newEventType as EventType);
      const dateValue = newEventDate || null;
      const createdEvent = await createEvent({
        name: dateValue
          ? `${typeInfo.shortLabel} — ${format(new Date(dateValue), 'dd MMM yyyy')}`
          : typeInfo.shortLabel,
        type: newEventType as EventType,
        date: dateValue,
        location: newEventLocation.trim() || null,
        state_province: vendor.state_province ?? 'KwaZulu-Natal',
        estimated_guest_count: guests,
        size: guests <= 80 ? 'small' : guests <= 200 ? 'medium' : 'large',
        notes: null,
      } as any);

      if (!createdEvent) {
        setIsSubmitting(false);
        return;
      }

      eventId = createdEvent.id;
      requestDate = createdEvent.date || null;
    }

    const success = await createRequest({
      event_id: eventId,
      vendor_id: vendor.id,
      requester_user_id: '', // Will be set by the hook
      message: message.trim() || null,
      event_date: requestDate,
      guest_count: guestCount ? parseInt(guestCount) : null,
      budget_range: budgetRange.trim() || null,
    });
    setIsSubmitting(false);

    if (success) {
      setOpen(false);
      setMessage('');
      setGuestCount('');
      setBudgetRange('');
      setSelectedEventId('');
      setNewEventType('');
      setNewEventDate('');
      setNewEventLocation('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request a quote from {vendor.name}</DialogTitle>
          <DialogDescription>
            Send your event details and the vendor will respond with a quote
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select event *</Label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    <span className="flex flex-col">
                      <span>{event.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {getEventTypeInfo(event.type).shortLabel}
                        {event.date && ` • ${format(new Date(event.date), 'dd MMM yyyy')}`}
                      </span>
                    </span>
                  </SelectItem>
                ))}
                <SelectItem value={NEW_EVENT}>+ Create a new ceremony</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isNewEvent && (
            <div className="space-y-4 rounded-lg border border-border p-3">
              <div className="space-y-2">
                <Label>Ceremony type *</Label>
                <Select
                  value={newEventType}
                  onValueChange={(value) => setNewEventType(value as EventType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a ceremony" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-event-date">Date (optional)</Label>
                <Input
                  id="new-event-date"
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-event-location">Location (optional)</Label>
                <Input
                  id="new-event-location"
                  placeholder="e.g. Umlazi, Durban"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  maxLength={200}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="guests">Expected guests</Label>
              <Input
                id="guests"
                type="number"
                placeholder="e.g. 150"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className={validationErrors.guestCount ? 'border-destructive' : ''}
              />
              {validationErrors.guestCount && (
                <p className="text-xs text-destructive">{validationErrors.guestCount}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget range</Label>
              <Input
                id="budget"
                placeholder="e.g. R5,000-R10,000"
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                maxLength={50}
                className={validationErrors.budgetRange ? 'border-destructive' : ''}
              />
              {validationErrors.budgetRange && (
                <p className="text-xs text-destructive">{validationErrors.budgetRange}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Tell the vendor about your requirements, preferences, or any special requests..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={2000}
              className={validationErrors.message ? 'border-destructive' : ''}
            />
            {validationErrors.message && (
              <p className="text-xs text-destructive">{validationErrors.message}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedEventId || isSubmitting}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Sending...' : 'Send request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}