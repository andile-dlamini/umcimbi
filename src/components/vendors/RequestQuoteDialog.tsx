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
import { Vendor, getEventTypeInfo } from '@/types/database';
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

export function RequestQuoteDialog({ vendor, children }: RequestQuoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [message, setMessage] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { events } = useEvents();
  const { createRequest } = useMyServiceRequests();

  const selectedEvent = events.find(e => e.id === selectedEventId);

  const handleSubmit = async () => {
    if (!selectedEventId) return;

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
    const success = await createRequest({
      event_id: selectedEventId,
      vendor_id: vendor.id,
      requester_user_id: '', // Will be set by the hook
      message: message.trim() || null,
      event_date: selectedEvent?.date || null,
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
              </SelectContent>
            </Select>
            {events.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Create an event first to request quotes
              </p>
            )}
          </div>

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