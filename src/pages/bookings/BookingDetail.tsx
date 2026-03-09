import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { useBookingDetails } from '@/hooks/useBookings';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Banknote, CheckCircle, AlertTriangle, Star, Camera, CreditCard, Loader2, FileText, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { bookingStatusConfig } from '@/lib/statusConfig';
import { useState, useEffect } from 'react';
import { ReviewDialog } from '@/components/chat/ReviewDialog';
import { useClientBookings } from '@/hooks/useBookings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { viewQuotePdfAction, viewOrderPdfAction } from '@/lib/quoteActions';

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
  const [searchParams] = useSearchParams();
  const { user, vendorProfile } = useAuth();
  const { booking, deliveryProofs, reviews, isLoading, refreshDetails } = useBookingDetails(bookingId);
  const { reportProblem, markAsCompleted } = useClientBookings();
  
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isPayingDeposit, setIsPayingDeposit] = useState(false);
  const [isPayingBalance, setIsPayingBalance] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isLoadingQuotePdf, setIsLoadingQuotePdf] = useState(false);

  // Handle Yoco redirect back
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const kind = searchParams.get('kind');
    if (paymentStatus === 'success') {
      toast.success(`${kind === 'deposit' ? 'Deposit' : 'Balance'} payment successful! It may take a moment to reflect.`);
      navigate(`/bookings/${bookingId}`, { replace: true });
      setTimeout(() => refreshDetails(), 2000);
    } else if (paymentStatus === 'cancelled') {
      toast.info('Payment was cancelled.');
      navigate(`/bookings/${bookingId}`, { replace: true });
    }
  }, [searchParams, bookingId, navigate, refreshDetails]);

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

  const handleViewOrderPdf = async () => {
    if (!bookingId) return;
    setIsLoadingPdf(true);
    await viewOrderPdfAction(bookingId);
    setIsLoadingPdf(false);
  };

  const handleViewQuotePdf = async () => {
    if (!booking?.quote_id) return;
    setIsLoadingQuotePdf(true);
    await viewQuotePdfAction(booking.quote_id);
    setIsLoadingQuotePdf(false);
  };

  const handleYocoPayment = async (kind: 'deposit' | 'balance') => {
    if (!bookingId || !user) return;

    const setLoading = kind === 'deposit' ? setIsPayingDeposit : setIsPayingBalance;
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to make a payment');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-yoco-checkout', {
        body: {
          bookingId,
          kind,
          successUrl: `${window.location.origin}/bookings/${bookingId}?payment=success&kind=${kind}`,
          cancelUrl: `${window.location.origin}/bookings/${bookingId}?payment=cancelled`,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error('No redirect URL received');
      }
    } catch (err: any) {
      console.error('Yoco payment error:', err);
      toast.error(err.message || 'Failed to start payment');
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Order Details" showBack />
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
        <PageHeader title="Order Details" showBack />
        <div className="p-4">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Order not found</p>
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
      <PageHeader title="Order Details" showBack />
      
      <div className="p-4 max-w-lg mx-auto space-y-4">
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
              <div className="flex items-center gap-3">
                {booking.vendor?.image_urls?.[0] && (
                  <img
                    src={booking.vendor.image_urls[0]}
                    alt={booking.vendor.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <CardTitle>{booking.vendor?.name}</CardTitle>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{booking.vendor?.rating ? Number(booking.vendor.rating).toFixed(1) : 'New'}</span>
                  </div>
                </div>
              </div>
              <Badge className={status.className}>{status.label}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(booking as any).order_number && (
              <p className="text-xs text-muted-foreground font-mono">
                Order: {(booking as any).order_number}
              </p>
            )}
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

            {/* View Order PDF */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleViewOrderPdf}
              disabled={isLoadingPdf}
            >
              {isLoadingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
              View Order PDF
            </Button>

            {/* View original Quotation PDF */}
            {booking.quote_id && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={handleViewQuotePdf}
                disabled={isLoadingQuotePdf}
              >
                {isLoadingQuotePdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}
                View Original Quotation
              </Button>
            )
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
              {isClient && depositDue && booking.deposit_status !== 'paid' && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleYocoPayment('deposit')}
                  disabled={isPayingDeposit}
                >
                  {isPayingDeposit ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  {isPayingDeposit ? 'Redirecting to Yoco...' : 'Pay Deposit'}
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
              {isClient && balanceDue && booking.balance_status !== 'paid' && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleYocoPayment('balance')}
                  disabled={isPayingBalance}
                >
                  {isPayingBalance ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  {isPayingBalance ? 'Redirecting to Yoco...' : 'Pay Balance'}
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
