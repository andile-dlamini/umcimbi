import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, DollarSign, FileText, CreditCard, Star, ExternalLink, Upload, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { bookingStatusConfig } from '@/lib/statusConfig';
import { EftPaymentDialog } from '@/components/chat/EftPaymentDialog';
import { ReviewDialog } from '@/components/chat/ReviewDialog';

interface ChatDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  isVendorView: boolean;
}

interface ConversationDetails {
  event?: any;
  latestQuote?: any;
  booking?: any;
  reviews?: any[];
}

const paymentStatusLabels: Record<string, { label: string; className: string }> = {
  not_due: { label: 'Not Due', className: 'text-muted-foreground' },
  due: { label: 'Due', className: 'text-amber-600 dark:text-amber-400' },
  paid: { label: 'Paid', className: 'text-emerald-600 dark:text-emerald-400' },
  pending_verification: { label: 'Pending Verification', className: 'text-blue-600 dark:text-blue-400' },
};

export function ChatDetailsDrawer({ open, onOpenChange, conversationId, isVendorView }: ChatDetailsDrawerProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [details, setDetails] = useState<ConversationDetails>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showEftDialog, setShowEftDialog] = useState<'deposit' | 'balance' | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!conversationId) return;
    setIsLoading(true);

    try {
      // Get conversation
      const { data: conv } = await supabase
        .from('conversations')
        .select('event_id, vendor_id, user_id')
        .eq('id', conversationId)
        .single();

      if (!conv) return;

      // Fetch event
      let event = null;
      if (conv.event_id) {
        const { data } = await supabase
          .from('events')
          .select('id, name, date, location, estimated_guest_count, estimated_budget, type')
          .eq('id', conv.event_id)
          .single();
        event = data;
      }

      // Fetch latest quote
      const { data: quotes } = await supabase
        .from('quotes')
        .select('id, price, status, offer_number, deposit_percentage, final_offer_pdf_key, expires_at')
        .eq('vendor_id', conv.vendor_id)
        .order('created_at', { ascending: false })
        .limit(1);

      const latestQuote = quotes?.[0] || null;

      // Fetch booking
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, agreed_price, booking_status, deposit_status, balance_status, deposit_amount, balance_amount, deposit_paid_at, balance_paid_at')
        .eq('vendor_id', conv.vendor_id)
        .eq('client_id', conv.user_id)
        .order('created_at', { ascending: false })
        .limit(1);

      const booking = bookings?.[0] || null;

      // Fetch reviews for this booking
      let reviews: any[] = [];
      if (booking) {
        const { data: reviewData } = await supabase
          .from('booking_reviews')
          .select('id, reviewer_id, reviewer_type, rating')
          .eq('booking_id', booking.id);
        reviews = reviewData || [];
      }

      setDetails({ event, latestQuote, booking, reviews });
    } catch (err) {
      console.error('Error fetching details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (open) fetchDetails();
  }, [open, fetchDetails]);

  const { event, latestQuote, booking, reviews } = details;

  const hasReviewed = reviews?.some(r => r.reviewer_id === user?.id);
  const canReview = booking?.booking_status === 'completed'
    && booking?.deposit_paid_at
    && booking?.balance_paid_at
    && !hasReviewed;

  const isClient = !isVendorView;
  const depositDue = booking && (booking.deposit_status === 'due' || (booking.deposit_status === 'not_due' && booking.booking_status === 'pending_deposit'));
  const balanceDue = booking && booking.balance_status === 'due';

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[340px] sm:w-[400px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Details</SheetTitle>
          </SheetHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              {/* Event Summary */}
              {event && (
                <Card>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Calendar className="h-4 w-4 text-primary" />
                      {event.name}
                    </div>
                    {event.date && (
                      <p className="text-xs text-muted-foreground ml-6">
                        {format(new Date(event.date), 'dd MMM yyyy')}
                      </p>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 ml-1" />
                        {event.location}
                      </div>
                    )}
                    <div className="flex gap-4 ml-6">
                      {event.estimated_guest_count && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" /> {event.estimated_guest_count} guests
                        </span>
                      )}
                      {event.estimated_budget && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> R{event.estimated_budget.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="w-full mt-1" onClick={() => { onOpenChange(false); navigate(`/events/${event.id}`); }}>
                      <ExternalLink className="h-3 w-3 mr-1" /> View Event
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Quote Summary */}
              {latestQuote && (
                <Card>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Latest Quote
                      </span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {latestQuote.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="ml-6 space-y-1">
                      <p className="text-lg font-bold">R{latestQuote.price?.toLocaleString()}</p>
                      {latestQuote.offer_number && (
                        <p className="text-xs text-muted-foreground font-mono">{latestQuote.offer_number}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Booking Summary */}
              {booking && (
                <Card>
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        Booking
                      </span>
                      <Badge className={bookingStatusConfig[booking.booking_status as keyof typeof bookingStatusConfig]?.className || ''}>
                        {bookingStatusConfig[booking.booking_status as keyof typeof bookingStatusConfig]?.label || booking.booking_status}
                      </Badge>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-bold">R{booking.agreed_price?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Deposit (R{booking.deposit_amount?.toLocaleString()})</span>
                        <span className={paymentStatusLabels[booking.deposit_status]?.className}>
                          {paymentStatusLabels[booking.deposit_status]?.label}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Balance (R{booking.balance_amount?.toLocaleString()})</span>
                        <span className={paymentStatusLabels[booking.balance_status]?.className}>
                          {paymentStatusLabels[booking.balance_status]?.label}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    {/* Contextual Actions */}
                    <div className="space-y-2">
                      {isClient && depositDue && booking.deposit_status !== 'paid' && booking.deposit_status !== 'pending_verification' && (
                        <Button size="sm" className="w-full" onClick={() => setShowEftDialog('deposit')}>
                          <Upload className="h-4 w-4 mr-2" />
                          Pay Deposit (EFT)
                        </Button>
                      )}
                      {isClient && balanceDue && booking.balance_status !== 'paid' && booking.balance_status !== 'pending_verification' && (
                        <Button size="sm" className="w-full" onClick={() => setShowEftDialog('balance')}>
                          <Upload className="h-4 w-4 mr-2" />
                          Pay Balance (EFT)
                        </Button>
                      )}
                      {booking.deposit_status === 'pending_verification' && (
                        <p className="text-xs text-center text-blue-600 dark:text-blue-400">⏳ Deposit proof submitted — awaiting verification</p>
                      )}
                      {booking.balance_status === 'pending_verification' && (
                        <p className="text-xs text-center text-blue-600 dark:text-blue-400">⏳ Balance proof submitted — awaiting verification</p>
                      )}

                      {canReview && (
                        <Button size="sm" variant="outline" className="w-full" onClick={() => setShowReviewDialog(true)}>
                          <Star className="h-4 w-4 mr-2" />
                          {isVendorView ? 'Rate Client' : 'Rate Vendor'}
                        </Button>
                      )}
                      {hasReviewed && (
                        <p className="text-xs text-center text-muted-foreground">✅ Rating submitted</p>
                      )}

                      <Button variant="ghost" size="sm" className="w-full" onClick={() => { onOpenChange(false); navigate(`/bookings/${booking.id}`); }}>
                        <ExternalLink className="h-3 w-3 mr-1" /> View Booking
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!event && !latestQuote && !booking && (
                <p className="text-sm text-muted-foreground text-center py-8">No details yet. Start negotiating!</p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* EFT Payment Dialog */}
      {showEftDialog && booking && (
        <EftPaymentDialog
          open={!!showEftDialog}
          onOpenChange={(o) => { if (!o) setShowEftDialog(null); }}
          bookingId={booking.id}
          kind={showEftDialog}
          amount={showEftDialog === 'deposit' ? booking.deposit_amount : booking.balance_amount}
          onSuccess={() => { setShowEftDialog(null); fetchDetails(); }}
        />
      )}

      {/* Review Dialog */}
      {showReviewDialog && booking && (
        <ReviewDialog
          open={showReviewDialog}
          onOpenChange={setShowReviewDialog}
          bookingId={booking.id}
          isVendorView={isVendorView}
          onSuccess={() => { setShowReviewDialog(false); fetchDetails(); }}
        />
      )}
    </>
  );
}
