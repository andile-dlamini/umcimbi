import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { useBookingDetails, useClientBookings } from '@/hooks/useBookings';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, DollarSign, Phone, MessageCircle, CheckCircle, AlertTriangle, Star, Camera } from 'lucide-react';
import { format } from 'date-fns';
import { BookingStatus, PaymentStatus } from '@/types/booking';
import { bookingStatusConfig } from '@/lib/statusConfig';
import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const statusConfig = bookingStatusConfig;

const paymentStatusCfg: Record<PaymentStatus, { label: string; color: string }> = {
  not_due: { label: 'Not Due', color: 'text-muted-foreground' },
  due: { label: 'Due', color: 'text-amber-600 dark:text-amber-400' },
  paid: { label: 'Paid', color: 'text-emerald-600 dark:text-emerald-400' },
};

export default function BookingDetail() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user, vendorProfile } = useAuth();
  const { booking, deliveryProofs, reviews, isLoading, submitReview } = useBookingDetails(bookingId);
  const { updatePaymentStatus, markAsCompleted, reportProblem } = useClientBookings();
  
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPayingDeposit, setIsPayingDeposit] = useState(false);
  const [isPayingBalance, setIsPayingBalance] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const isClient = booking?.client_id === user?.id;
  const isVendor = vendorProfile?.id === booking?.vendor_id;
  const hasReviewed = reviews.some(r => r.reviewer_id === user?.id);
  const canReview = booking?.booking_status === 'completed' && !hasReviewed;

  const handlePayDeposit = async () => {
    if (!bookingId || isPayingDeposit) return;
    setIsPayingDeposit(true);
    await updatePaymentStatus(bookingId, 'deposit_status', 'paid');
  };

  const handlePayBalance = async () => {
    if (!bookingId || isPayingBalance) return;
    setIsPayingBalance(true);
    await updatePaymentStatus(bookingId, 'balance_status', 'paid');
  };

  const handleMarkComplete = async () => {
    if (!bookingId || isCompleting) return;
    setIsCompleting(true);
    await markAsCompleted(bookingId);
    setIsCompleting(false);
  };

  const handleReportProblem = async () => {
    if (!bookingId || isReporting) return;
    setIsReporting(true);
    await reportProblem(bookingId);
    setIsReporting(false);
  };

  const handleSubmitReview = async () => {
    setIsSubmitting(true);
    await submitReview(rating, comment);
    setIsSubmitting(false);
    setShowReviewDialog(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Booking Details" showBack />
        <div className="p-4 space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Booking Details" showBack />
        <div className="p-4">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Booking not found</p>
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </div>
    );
  }

  const status = statusConfig[booking.booking_status];

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Booking Details" showBack />
      
      <div className="p-4 space-y-4">
        {/* Status Banner */}
        {canReview && (
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <span className="font-medium">Ready to review!</span>
              </div>
              <Button size="sm" onClick={() => setShowReviewDialog(true)}>
                Rate Vendor
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{booking.vendor?.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{booking.service_category}</p>
              </div>
              <Badge className={status.className}>{status.label}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{booking.event?.name}</span>
              </div>
              {booking.event_date_time && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(booking.event_date_time), 'PPp')}</span>
                </div>
              )}
              {booking.event?.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.event.location}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Contact Actions */}
            <div className="flex gap-2">
              {booking.vendor?.phone_number && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`tel:${booking.vendor.phone_number}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </a>
                </Button>
              )}
              {booking.vendor?.whatsapp_number && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`https://wa.me/${booking.vendor.whatsapp_number.replace(/\D/g, '')}`} target="_blank">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Price</span>
              <span className="text-lg font-bold">R{booking.agreed_price.toLocaleString()}</span>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Deposit</p>
                  <p className="text-sm text-muted-foreground">R{booking.deposit_amount.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={paymentStatusCfg[booking.deposit_status].color}>
                    {paymentStatusCfg[booking.deposit_status].label}
                  </span>
                  {isClient && booking.deposit_status === 'due' && (
                    <Button size="sm" onClick={handlePayDeposit} disabled={isPayingDeposit}>
                      {isPayingDeposit ? 'Processing...' : 'Mark Paid'}
                    </Button>
                  )}
                  {isClient && booking.deposit_status === 'not_due' && booking.booking_status === 'pending_deposit' && (
                    <Button size="sm" onClick={handlePayDeposit} disabled={isPayingDeposit}>
                      {isPayingDeposit ? 'Processing...' : 'Pay Deposit'}
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Balance</p>
                  <p className="text-sm text-muted-foreground">R{booking.balance_amount.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={paymentStatusCfg[booking.balance_status].color}>
                    {paymentStatusCfg[booking.balance_status].label}
                  </span>
                  {isClient && booking.balance_status === 'due' && (
                    <Button size="sm" onClick={handlePayBalance} disabled={isPayingBalance}>
                      {isPayingBalance ? 'Processing...' : 'Mark Paid'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Proofs */}
        {deliveryProofs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Delivery Proofs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {deliveryProofs.flatMap(proof => 
                  proof.photos.map((photo, idx) => (
                    <img
                      key={`${proof.id}-${idx}`}
                      src={photo}
                      alt="Delivery proof"
                      className="w-full h-24 object-cover rounded-md"
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {isClient && booking.booking_status === 'confirmed' && (
          <div className="space-y-2">
            <Button className="w-full" onClick={handleMarkComplete} disabled={isCompleting || isReporting}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {isCompleting ? 'Processing...' : 'Everything Delivered as Agreed'}
            </Button>
            <Button variant="destructive" className="w-full" onClick={handleReportProblem} disabled={isReporting || isCompleting}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              {isReporting ? 'Reporting...' : 'Report a Problem'}
            </Button>
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Rating</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-1 ${star <= rating ? 'text-yellow-500' : 'text-muted-foreground'}`}
                  >
                    <Star className="h-8 w-8 fill-current" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Comment (optional)</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReview} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <BottomNav />
    </div>
  );
}
