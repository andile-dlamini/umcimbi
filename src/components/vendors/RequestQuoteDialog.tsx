import { useState, useEffect, useRef } from 'react';
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
  date: z.string().trim().min(1, 'Please choose the event date'),
  guestCount: z.string().trim().refine((val) => {
    if (!/^\d+$/.test(val)) return false;
    const num = parseInt(val, 10);
    return num >= 1 && num <= 10000;
  }, { message: 'Guest count must be a whole number between 1 and 10,000' }),
  location: z.string().trim().min(1, 'Please enter the event location').max(200, 'Location must be less than 200 characters'),
  budgetRange: z.string().max(50, 'Budget range must be less than 50 characters').optional(),
  message: z.string().max(2000, 'Message must be less than 2,000 characters').optional(),
});
interface RequestQuoteDialogProps {
  vendor: Vendor;
  children: React.ReactNode;
  defaultEventId?: string;
}

const NEW_EVENT = '__new__';

export function RequestQuoteDialog({ vendor, children, defaultEventId }: RequestQuoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(defaultEventId ?? '');
  const [message, setMessage] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [newEventType, setNewEventType] = useState<EventType | ''>('');
  const [newEventName, setNewEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const prefilledFor = useRef<string | null>(null);
  const { events, createEvent, updateEvent } = useEvents();
  const { createRequest } = useMyServiceRequests();

  const isNewEvent = selectedEventId === NEW_EVENT;
  const selectedEvent = events.find(e => e.id === selectedEventId);

  // Pre-fill from the chosen existing ceremony; re-run whenever the selection changes
  useEffect(() => {
    if (!selectedEventId) return;
    if (selectedEventId === NEW_EVENT) {
      if (prefilledFor.current !== NEW_EVENT) {
        setEventDate('');
        setGuestCount('');
        setEventLocation('');
        prefilledFor.current = NEW_EVENT;
      }
      return;
    }
    // Already pre-filled for this ceremony — do not clobber the organiser's edits
    // when the events array is replaced by a later fetch or an updateEvent call.
    if (prefilledFor.current === selectedEventId) return;
    const ev = events.find(e => e.id === selectedEventId);
    if (!ev) return; // events not loaded yet; this effect re-runs when they arrive
    setEventDate(ev.date ?? '');
    setGuestCount(ev.estimated_guest_count ? String(ev.estimated_guest_count) : '');
    setEventLocation(ev.location ?? '');
    prefilledFor.current = selectedEventId;
  }, [selectedEventId, events]);

  const canSubmit =
    !!selectedEventId &&
    !!eventDate &&
    guestCount.trim() !== '' &&
    eventLocation.trim() !== '' &&
    (!isNewEvent || (!!newEventType && (newEventType !== 'other' || newEventName.trim() !== '')));

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const result = quoteRequestSchema.safeParse({
      date: eventDate,
      guestCount,
      location: eventLocation,
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

    const guests = parseInt(guestCount.trim(), 10);
    const location = eventLocation.trim();
    let eventId = selectedEventId;

    if (isNewEvent) {
      const typeInfo = getEventTypeInfo(newEventType as EventType);
      const createdEvent = await createEvent({
        name: newEventType === 'other'
          ? newEventName.trim()
          : `${typeInfo.shortLabel} — ${format(new Date(eventDate), 'dd MMM yyyy')}`,
        type: newEventType as EventType,
        date: eventDate,
        location,
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
    } else if (selectedEvent) {
      const changes: Record<string, unknown> = {};
      if ((selectedEvent.date ?? '') !== eventDate) changes.date = eventDate;
      if ((selectedEvent.location ?? '') !== location) changes.location = location;
      if (selectedEvent.estimated_guest_count !== guests) changes.estimated_guest_count = guests;
      if (Object.keys(changes).length > 0) {
        await updateEvent(selectedEvent.id, changes as any);
      }
    }

    const success = await createRequest({
      event_id: eventId,
      vendor_id: vendor.id,
      requester_user_id: '', // Will be set by the hook
      message: message.trim() || null,
      event_date: eventDate,
      guest_count: guests,
      budget_range: budgetRange.trim() || null,
    });
    setIsSubmitting(false);

    if (success) {
      setOpen(false);
      setMessage('');
      setGuestCount('');
      setBudgetRange('');
      setSelectedEventId(defaultEventId ?? '');
      prefilledFor.current = null;
      setNewEventType('');
      setNewEventName('');
      setEventDate('');
      setEventLocation('');
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

              {newEventType === 'other' && (
                <div className="space-y-2">
                  <Label htmlFor="new-event-name">What kind of ceremony? *</Label>
                  <Input
                    id="new-event-name"
                    placeholder="e.g. White wedding, 60th birthday"
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    maxLength={100}
                  />
                </div>
              )}
            </div>
          )}

          {selectedEventId && (
            <>
              <div className="space-y-2">
                <Label htmlFor="event-date">Date *</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className={validationErrors.date ? 'border-destructive' : ''}
                />
                {validationErrors.date && (
                  <p className="text-xs text-destructive">{validationErrors.date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-location">Event location (incl. nearest school) *</Label>
                <Input
                  id="event-location"
                  placeholder="e.g. 12 Khuzimpi Rd, Umlazi — near Menzi High School"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  maxLength={200}
                  className={validationErrors.location ? 'border-destructive' : ''}
                />
                {validationErrors.location && (
                  <p className="text-xs text-destructive">{validationErrors.location}</p>
                )}
              </div>
            </>
          )}

          {selectedEventId && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="guests">Expected guests *</Label>
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
          )}

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
            disabled={!canSubmit || isSubmitting}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Sending...' : 'Send request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}