import { useState, useEffect } from 'react';
import { FileText, Check, X, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface QuoteCardMetadata {
  quote_id: string;
  offer_number: string;
  total: number;
  deposit_percentage: number;
  deposit_amount: number;
  pdf_key: string;
  status: string;
  booking_id: string | null;
}

interface QuoteCardProps {
  metadata: QuoteCardMetadata;
  isVendorView: boolean;
  messageId: string;
  onStatusChange?: () => void;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending_client: { label: 'Pending', variant: 'outline' },
  client_accepted: { label: 'Accepted', variant: 'default' },
  client_declined: { label: 'Declined', variant: 'destructive' },
  expired: { label: 'Expired', variant: 'secondary' },
};

export function QuoteCard({ metadata, isVendorView, messageId, onStatusChange }: QuoteCardProps) {
  const navigate = useNavigate();
  const [currentStatus, setCurrentStatus] = useState(metadata.status);
  const [bookingId, setBookingId] = useState(metadata.booking_id);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [depositPaid, setDepositPaid] = useState(false);

  // Refresh status from DB on mount
  useEffect(() => {
    const refreshStatus = async () => {
      const { data: quote } = await supabase
        .from('quotes')
        .select('status')
        .eq('id', metadata.quote_id)
        .single();
      if (quote) setCurrentStatus(quote.status);

      // Check if booking exists
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
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-final-offer-url?quote_id=${metadata.quote_id}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      const result = await response.json();
      if (result.url) {
        window.open(result.url, '_blank');
      } else {
        toast.error('Could not load PDF');
      }
    } catch (err) {
      toast.error('Failed to load PDF');
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const { data, error } = await supabase.functions.invoke('accept-quote', {
        body: { quote_id: metadata.quote_id },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setCurrentStatus('client_accepted');
      setBookingId(data.booking_id);
      toast.success('Quote accepted! Pay deposit to confirm booking.');
      onStatusChange?.();
    } catch (err) {
      toast.error('Failed to accept quote');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    try {
      const { data, error } = await supabase.functions.invoke('decline-quote', {
        body: { quote_id: metadata.quote_id },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setCurrentStatus('client_declined');
      toast.info('Quote declined');
      onStatusChange?.();
    } catch (err) {
      toast.error('Failed to decline quote');
    } finally {
      setIsDeclining(false);
    }
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
      {/* Header */}
      <div className="bg-primary/10 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">Quotation</span>
        </div>
        <Badge variant={statusInfo.variant} className="text-xs">
          {statusInfo.label}
        </Badge>
      </div>

      {/* Body */}
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
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-border space-y-2">
        <Button
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
              size="sm"
              className="flex-1"
              onClick={handleAccept}
              disabled={isAccepting}
            >
              {isAccepting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Accept
            </Button>
            <Button
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
      </div>
    </div>
  );
}
