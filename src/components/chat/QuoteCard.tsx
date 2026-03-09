import { useState, useEffect } from 'react';
import { FileText, Check, X, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { acceptQuoteAction, declineQuoteAction, viewQuotePdfAction } from '@/lib/quoteActions';

interface QuoteCardMetadata {
  quote_id: string;
  offer_number: string;
  total: number;
  deposit_percentage: number;
  deposit_amount: number;
  platform_fee: number;
  vendor_payout: number;
  pdf_key: string;
  status: string;
  booking_id: string | null;
}

interface QuoteCardProps {
  metadata: QuoteCardMetadata;
  isVendorView: boolean;
  messageId: string;
  onStatusChange?: () => void;
  onRequestAdjustment?: (quoteId: string) => void;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending_client: { label: 'Pending', variant: 'outline' },
  client_accepted: { label: 'Accepted', variant: 'default' },
  client_declined: { label: 'Declined', variant: 'destructive' },
  expired: { label: 'Expired', variant: 'secondary' },
};

export function QuoteCard({ metadata, isVendorView, messageId, onStatusChange, onRequestAdjustment }: QuoteCardProps) {
  const navigate = useNavigate();
  const [currentStatus, setCurrentStatus] = useState(metadata.status);
  const [bookingId, setBookingId] = useState(metadata.booking_id);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [depositPaid, setDepositPaid] = useState(false);

  useEffect(() => {
    const refreshStatus = async () => {
      const { data: quote } = await supabase
        .from('quotes')
        .select('status')
        .eq('id', metadata.quote_id)
        .single();
      if (quote) setCurrentStatus(quote.status);

      const { data: booking } = await supabase
        .from('bookings')
        .select('id, deposit_status')
        .eq('quote_id', metadata.quote_id)
        .maybeSingle();
      if (booking) {
        setBookingId(booking.id);
        setDepositPaid(booking.deposit_status === 'paid');
      }
    };
    refreshStatus();
  }, [metadata.quote_id]);

  const handleViewPdf = async () => {
    setIsLoadingPdf(true);
    await viewQuotePdfAction(metadata.quote_id);
    setIsLoadingPdf(false);
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    const result = await acceptQuoteAction(metadata.quote_id);
    if (result.success) {
      setCurrentStatus('client_accepted');
      setBookingId(result.bookingId || null);
      onStatusChange?.();
    }
    setIsAccepting(false);
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    const success = await declineQuoteAction(metadata.quote_id);
    if (success) {
      setCurrentStatus('client_declined');
      onStatusChange?.();
    }
    setIsDeclining(false);
  };

  const handlePayDeposit = () => {
    if (bookingId) {
      navigate(`/bookings/${bookingId}`);
    } else {
      toast.error('Booking not found');
    }
  };

  const formatCurrency = (amount: number) =>
    `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

  const statusInfo = statusLabels[currentStatus] || statusLabels.pending_client;
  const isPending = currentStatus === 'pending_client';
  const isAccepted = currentStatus === 'client_accepted';

  return (
    <div className="w-full max-w-[85%] rounded-xl border-2 border-primary/30 bg-card overflow-hidden">
      <div className="bg-primary/10 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">Quotation</span>
        </div>
        <Badge variant={statusInfo.variant} className="text-xs">
          {statusInfo.label}
        </Badge>
      </div>

      <div className="px-4 py-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Ref</span>
          <span className="text-sm font-mono font-medium">{metadata.offer_number}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="text-lg font-bold">{formatCurrency(metadata.total)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Deposit ({metadata.deposit_percentage}%)</span>
          <span className="text-sm font-medium">{formatCurrency(metadata.deposit_amount)}</span>
        </div>
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>Incl. 8% service fee</span>
          <span>{formatCurrency(metadata.platform_fee || metadata.total * 0.08)}</span>
        </div>
        {isVendorView && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-emerald-600">You receive</span>
            <span className="font-medium text-emerald-600">{formatCurrency(metadata.vendor_payout || metadata.total * 0.92)}</span>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-border space-y-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleViewPdf}
          disabled={isLoadingPdf}
        >
          {isLoadingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}
          View PDF
        </Button>

        {!isVendorView && isPending && (
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="flex-1"
              onClick={handleAccept}
              disabled={isAccepting}
            >
              {isAccepting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Accept
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={handleDecline}
              disabled={isDeclining}
            >
              {isDeclining ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
              Decline
            </Button>
          </div>
        )}

        {!isVendorView && isAccepted && !depositPaid && (
          <Button
            type="button"
            size="sm"
            className="w-full"
            variant="default"
            onClick={handlePayDeposit}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Pay Deposit
          </Button>
        )}

        {depositPaid && (
          <div className="text-center text-sm text-muted-foreground py-1">
            ✅ Deposit paid
          </div>
        )}

        {isAccepted && bookingId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => navigate(`/bookings/${bookingId}`)}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Booking
          </Button>
        )}
      </div>
    </div>
  );
}
