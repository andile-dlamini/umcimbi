import { useState, useEffect } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVendorReviews } from '@/hooks/useVendorReviews';
import { useCanReviewVendor } from '@/hooks/useCanReviewVendor';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface VendorRatingProps {
  vendorId: string;
}

function StarRating({ 
  rating, 
  onRate, 
  interactive = false,
  size = 'md'
}: { 
  rating: number; 
  onRate?: (rating: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md';
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={cn(
            'transition-transform',
            interactive && 'hover:scale-110 cursor-pointer',
            !interactive && 'cursor-default'
          )}
        >
          <Star
            className={cn(
              sizeClass,
              (hoverRating || rating) >= star
                ? 'fill-warning text-warning'
                : 'text-muted-foreground'
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function VendorRating({ vendorId }: VendorRatingProps) {
  const { user } = useAuth();
  const { reviews, userReview, submitReview, deleteReview, isLoading } = useVendorReviews(vendorId);
  const { canReview, hasExistingReview, isLoading: eligibilityLoading } = useCanReviewVendor(vendorId);
  
  const [newRating, setNewRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Update local state when userReview changes
  useEffect(() => {
    if (userReview) {
      setNewRating(userReview.rating);
      setComment(userReview.comment || '');
    }
  }, [userReview]);

  const handleSubmit = async () => {
    if (newRating === 0) return;
    
    setIsSubmitting(true);
    const success = await submitReview(newRating, comment);
    if (success) {
      setShowForm(false);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    await deleteReview();
    setNewRating(0);
    setComment('');
    setShowForm(false);
    setIsSubmitting(false);
  };

  // Determine if user can write/edit a review
  const canWriteReview = canReview || hasExistingReview;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Submit/Edit Review Section */}
        {user ? (
          eligibilityLoading ? (
            <p className="text-sm text-muted-foreground pb-4 border-b">
              Checking eligibility...
            </p>
          ) : canWriteReview ? (
            <div className="space-y-3 pb-4 border-b">
              {!showForm && !userReview ? (
                <Button variant="outline" onClick={() => setShowForm(true)} className="w-full">
                  <Star className="h-4 w-4 mr-2" />
                  Write a Review
                </Button>
              ) : showForm || userReview ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    {userReview ? 'Your Review' : 'Rate this vendor'}
                  </p>
                  <StarRating 
                    rating={newRating} 
                    onRate={setNewRating} 
                    interactive 
                  />
                  <Textarea
                    placeholder="Share your experience"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSubmit} 
                      disabled={newRating === 0 || isSubmitting}
                      className="flex-1"
                    >
                      {userReview ? 'Update' : 'Submit'} Review
                    </Button>
                    {userReview && (
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={handleDelete}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {!userReview && (
                      <Button 
                        variant="outline" 
                        onClick={() => setShowForm(false)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground pb-4 border-b">
              Complete a booking with this vendor to leave a review
            </p>
          )
        ) : (
          <p className="text-sm text-muted-foreground pb-4 border-b">
            Log in to leave a review
          </p>
        )}

        {/* Reviews List */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <StarRating rating={review.rating} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(review.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                )}
                {review.user_id === user?.id && (
                  <span className="text-xs text-primary">Your review</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
