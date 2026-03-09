import { useState } from 'react';
import { Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  isVendorView: boolean;
  onSuccess: () => void;
}

function CategoryRating({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-0.5 hover:scale-110 transition-transform"
          >
            <Star className={`h-7 w-7 ${star <= value ? 'fill-warning text-warning' : 'text-muted-foreground'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewDialog({ open, onOpenChange, bookingId, isVendorView, onSuccess }: ReviewDialogProps) {
  const { user } = useAuth();
  const [communicationRating, setCommunicationRating] = useState(5);
  const [secondaryRating, setSecondaryRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const overallRating = Math.round((communicationRating + secondaryRating) / 2 * 10) / 10;

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const { data: booking } = await supabase
        .from('bookings')
        .select('client_id, vendor_id')
        .eq('id', bookingId)
        .single();

      if (!booking) {
        toast.error('Booking not found');
        return;
      }

      const reviewerType = isVendorView ? 'vendor' : 'client';
      const reviewedPartyId = isVendorView ? booking.client_id : booking.vendor_id;
      const rating = Math.round(overallRating);

      const { error } = await supabase.from('booking_reviews').insert({
        booking_id: bookingId,
        reviewer_type: reviewerType,
        reviewer_id: user.id,
        reviewed_party_id: reviewedPartyId,
        rating,
        communication_rating: communicationRating,
        service_rating: isVendorView ? null : secondaryRating,
        payment_rating: isVendorView ? secondaryRating : null,
        comment: comment.trim() || null,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already submitted a review');
        } else {
          toast.error('Failed to submit review');
          console.error('Review error:', error);
        }
        return;
      }

      // Also write to vendor_reviews for public rating aggregation (if client reviewing vendor)
      if (!isVendorView) {
        await supabase.from('vendor_reviews').insert({
          vendor_id: booking.vendor_id,
          user_id: user.id,
          rating,
          comment: comment.trim() || null,
        }).then(({ error }) => {
          if (error && error.code !== '23505') {
            console.error('vendor_reviews insert error:', error);
          }
        });
      }

      toast.success('Review submitted!');
      onSuccess();
    } catch (err) {
      console.error('Review error:', err);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isVendorView ? 'Rate Planner' : 'Rate Vendor'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <CategoryRating
            label="Communication"
            value={communicationRating}
            onChange={setCommunicationRating}
          />
          <CategoryRating
            label={isVendorView ? 'Payment Reliability' : 'Service as Described'}
            value={secondaryRating}
            onChange={setSecondaryRating}
          />

          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Overall Rating</p>
            <div className="flex items-center justify-center gap-1">
              <Star className="h-5 w-5 fill-warning text-warning" />
              <span className="text-lg font-bold">{overallRating.toFixed(1)}</span>
            </div>
          </div>

          <div>
            <Label>Comment</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              className="mt-2"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
