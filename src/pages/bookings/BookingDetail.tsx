import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';

import { useBookingDetails } from '@/hooks/useBookings';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, BanknoteMessageCircle, CheckCircle, AlertTriangle, Star, Camera, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { BookingStatus, PaymentStatus } from '@/types/booking';
import { bookingStatusConfig } from '@/lib/statusConfig';
import { useState, useEffect } from 'react';
import { EftPaymentDialog } from '@/components/chat/EftPaymentDialog';
import { ReviewDialog } from '@/components/chat/ReviewDialog';
import { useClientBookings } from '@/hooks/useBookings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const statusConfig = bookingStatusConfig;

const paymentStatusCfg: Record<string, { label: string; color: string }> = {
  not_due: { label: 'Not Due', color: 'text-muted-foreground' },
  due: { label: 'Due', color: 'text-amber-600 dark:text-amber-400' },
  paid: { label: 'Paid', color: 'text-emerald-600 dark:text-emerald-400' },
  pending_verification: { label: 'Pending Verification', color: 'text-blue-600 dark:text-blue-400' },
};

export default function BookingDetail() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user, vendorProfile } = useAuth();
  const { booking, deliveryProofs, reviews, isLoading, refreshDetails } = useBookingDetails(bookingId);
  const { reportProblem, markAsCompleted } = useClientBookings();
  
  const [showEftDialog, setShowEftDialog] = useState<'deposit' | 'balance' | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [offerNumber, setOfferNumber] = useState<string | null>(null);

  // Fetch offer number from linked quote
  useEffect(() => {
    if (booking?.quote_id) {
      supabase
        .from('quotes')
        .select('offer_number')
        .eq('id', booking.quote_id)
        .single()
        .then(({ data }) => setOfferNumber(data?.offer_number || null));
    }
  }, [booking?.quote_id]);

  const isClient = booking?.client_id === user?.id;
  const isVendor = vendorProfile?.id === booking?.vendor_id;
  const hasReviewed = reviews.some(r => r.reviewer_id === user?.id);
  const canReview = booking?.booking_status === 'completed'
    && booking?.deposit_paid_at
    && booking?.balance_paid_at
    && !hasReviewed;

  const handleMarkComplete = async () => {
    if (!bookingId || isCompleting) return;
    setIsCompleting(true);
    await markAsCompleted(bookingId);
    setIsCompleting(false);
    refreshDetails();
  };

  const handleReportProblem = async () => {
    if (!bookingId || isReporting) return;
    setIsReporting(true);
    await reportProblem(bookingId);
    setIsReporting(false);
    refreshDetails();
  };

  const handleConfirmPayment = async (kind: 'deposit' | 'balance') => {
    if (!bookingId) return;
    setIsConfirmingPayment(true);
    try {
      // Update payment proof status
      await supabase
        .from('payment_proofs')
        .update({ status: 'verified', reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq('booking_id', bookingId)
        .eq('kind', kind)
        .eq('status', 'submitted');

      // Update booking payment status
      const field = kind === 'deposit' ? 'deposit_status' : 'balance_status';
      const updates: Record<string, any> = { [field]: 'paid' };
      
      if (kind === 'deposit') {
        updates.booking_status = 'confirmed';
        updates.balance_status = 'due';
        updates.deposit_paid_at = new Date().toISOString();
        updates.balance_due_at = new Date().toISOString();
      } else {
        updates.balance_paid_at = new Date().toISOString();
        updates.booking_status = 'completed';
      }

      await supabase.from('bookings').update(updates).eq('id', bookingId);

      // Post system message
      if (booking) {
        const { data: conv } = await supabase
          .from('conversations')
          .select('id')
          .eq('user_id', booking.client_id)
          .eq('vendor_id', booking.vendor_id)
          .order('last_message_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (conv) {
          const label = kind === 'deposit' ? 'Deposit' : 'Balance';
          const content = kind === 'balance'
            ? `✅ ${label} payment confirmed. Booking is now completed! Please rate each other.`
            : `✅ ${label} payment confirmed. Booking is now active!`;
          await supabase.from('messages').insert({
            conversation_id: conv.id,
            sender_type: 'system' as any,
            sender_user_id: user?.id,
            message_type: 'system',
            content,
          });
          await supabase.from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', conv.id);
        }
      }

      toast.success('Payment confirmed!');
      refreshDetails();
    } catch (err) {
      console.error('Confirm payment error:', err);
      toast.error('Failed to confirm payment');
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Booking Details" showBack />
        <div className="p-4 space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
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
      </div>
    );
  }

  const status = statusConfig[booking.booking_status];
  const depositDue = booking.deposit_status === 'due' || (booking.deposit_status === 'not_due' && booking.booking_status === 'pending_deposit');
  const balanceDue = booking.balance_status === 'due';

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Booking Details" showBack />
      
      <div className="p-4 space-y-4">
        {/* Review Banner */}
        {canReview && (
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <span className="font-medium">Ready to review!</span>
              </div>
              <Button size="sm" onClick={() => setShowReviewDialog(true)}>
                {isVendor ? 'Rate Client' : 'Rate Vendor'}
              </Button>
            </CardContent>
          </Card>
        )}

        {hasReviewed && (
          <p className="text-sm text-center text-muted-foreground">✅ Your rating has been submitted</p>
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
          </CardContent>
        </Card>

        {/* Payment Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Banknote className="h-5 w-5" />
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
              {/* Deposit */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Deposit</p>
                  <p className="text-sm text-muted-foreground">R{booking.deposit_amount.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={paymentStatusCfg[booking.deposit_status]?.color || 'text-muted-foreground'}>
                    {paymentStatusCfg[booking.deposit_status]?.label || booking.deposit_status}
                  </span>
                </div>
              </div>
              {isClient && depositDue && booking.deposit_status !== 'paid' && booking.deposit_status !== 'pending_verification' && (
                <Button size="sm" className="w-full" onClick={() => setShowEftDialog('deposit')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Pay Deposit (EFT)
                </Button>
              )}
              {isVendor && booking.deposit_status === 'pending_verification' && (
                <Button size="sm" variant="outline" className="w-full" onClick={() => handleConfirmPayment('deposit')} disabled={isConfirmingPayment}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isConfirmingPayment ? 'Confirming...' : 'Confirm Deposit Received'}
                </Button>
              )}

              {/* Balance */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Balance</p>
                  <p className="text-sm text-muted-foreground">R{booking.balance_amount.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={paymentStatusCfg[booking.balance_status]?.color || 'text-muted-foreground'}>
                    {paymentStatusCfg[booking.balance_status]?.label || booking.balance_status}
                  </span>
                </div>
              </div>
              {isClient && balanceDue && booking.balance_status !== 'paid' && booking.balance_status !== 'pending_verification' && (
                <Button size="sm" className="w-full" onClick={() => setShowEftDialog('balance')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Pay Balance (EFT)
                </Button>
              )}
              {isVendor && booking.balance_status === 'pending_verification' && (
                <Button size="sm" variant="outline" className="w-full" onClick={() => handleConfirmPayment('balance')} disabled={isConfirmingPayment}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isConfirmingPayment ? 'Confirming...' : 'Confirm Balance Received'}
                </Button>
              )}
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
                  proof.photos.map((photo: string, idx: number) => (
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

      {/* EFT Payment Dialog */}
      {showEftDialog && booking && (
        <EftPaymentDialog
          open={!!showEftDialog}
          onOpenChange={(o) => { if (!o) setShowEftDialog(null); }}
          bookingId={booking.id}
          kind={showEftDialog}
          amount={showEftDialog === 'deposit' ? booking.deposit_amount : booking.balance_amount}
          offerNumber={offerNumber}
          onSuccess={() => { setShowEftDialog(null); refreshDetails(); }}
        />
      )}

      {/* Review Dialog */}
      <ReviewDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        bookingId={bookingId || ''}
        isVendorView={!!isVendor}
        onSuccess={() => { setShowReviewDialog(false); refreshDetails(); }}
      />
      
      
    </div>
  );
}
