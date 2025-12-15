import { useState } from 'react';
import { Calendar, Users, Wallet, MessageCircle, Clock, CheckCircle, XCircle, Send, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ServiceRequestWithDetails, getEventTypeInfo } from '@/types/database';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ServiceRequestCardProps {
  request: ServiceRequestWithDetails;
  onRespond?: (requestId: string, response: string, quotedAmount?: number) => Promise<boolean>;
  onDecline?: (requestId: string, reason?: string) => Promise<boolean>;
  onAccept?: (requestId: string) => Promise<boolean>;
  onCancel?: (requestId: string) => Promise<boolean>;
  isVendorView?: boolean;
}

const statusConfig = {
  pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
  quoted: { label: 'Quoted', variant: 'default' as const, icon: Send },
  accepted: { label: 'Accepted', variant: 'default' as const, icon: CheckCircle },
  declined: { label: 'Declined', variant: 'destructive' as const, icon: XCircle },
  completed: { label: 'Completed', variant: 'outline' as const, icon: CheckCircle },
  cancelled: { label: 'Cancelled', variant: 'outline' as const, icon: XCircle },
};

export function ServiceRequestCard({
  request,
  onRespond,
  onDecline,
  onAccept,
  onCancel,
  isVendorView = false,
}: ServiceRequestCardProps) {
  const [showRespondDialog, setShowRespondDialog] = useState(false);
  const [response, setResponse] = useState('');
  const [quotedAmount, setQuotedAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const status = statusConfig[request.status];
  const StatusIcon = status.icon;

  const handleRespond = async () => {
    if (!onRespond) return;
    setIsSubmitting(true);
    const success = await onRespond(
      request.id,
      response,
      quotedAmount ? parseFloat(quotedAmount) : undefined
    );
    setIsSubmitting(false);
    if (success) {
      setShowRespondDialog(false);
      setResponse('');
      setQuotedAmount('');
    }
  };

  const handleDecline = async () => {
    if (!onDecline) return;
    setIsSubmitting(true);
    await onDecline(request.id);
    setIsSubmitting(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">
                {isVendorView
                  ? request.event?.name || 'Event'
                  : request.vendor?.name || 'Vendor'}
              </CardTitle>
              {request.event && (
                <p className="text-sm text-muted-foreground">
                  {getEventTypeInfo(request.event.type).shortLabel}
                </p>
              )}
              {/* Show requester info for vendor view */}
              {isVendorView && request.requester_profile && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-primary">
                  <User className="h-3 w-3" />
                  <span>
                    {request.requester_profile.full_name || request.requester_profile.phone_number || request.requester_profile.email || 'Unknown user'}
                  </span>
                </div>
              )}
            </div>
            <Badge variant={status.variant} className="shrink-0">
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Request details */}
          <div className="grid grid-cols-3 gap-2 text-sm">
            {request.event_date && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{format(new Date(request.event_date), 'dd MMM')}</span>
              </div>
            )}
            {request.guest_count && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>{request.guest_count} guests</span>
              </div>
            )}
            {request.budget_range && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Wallet className="h-3.5 w-3.5" />
                <span>{request.budget_range}</span>
              </div>
            )}
          </div>

          {/* Message */}
          {request.message && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm">{request.message}</p>
            </div>
          )}

          {/* Vendor response */}
          {request.vendor_response && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-xs font-medium text-primary mb-1">Vendor response</p>
              <p className="text-sm">{request.vendor_response}</p>
              {request.quoted_amount && (
                <p className="text-sm font-semibold text-primary mt-2">
                  Quoted: R{request.quoted_amount.toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          {isVendorView && request.status === 'pending' && onRespond && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleDecline}
                disabled={isSubmitting}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Decline
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => setShowRespondDialog(true)}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Send quote
              </Button>
            </div>
          )}

          {!isVendorView && request.status === 'quoted' && onAccept && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onDecline?.(request.id)}
                disabled={isSubmitting}
              >
                Decline
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onAccept(request.id)}
                disabled={isSubmitting}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Accept quote
              </Button>
            </div>
          )}

          {!isVendorView && request.status === 'pending' && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => onCancel(request.id)}
              disabled={isSubmitting}
            >
              Cancel request
            </Button>
          )}

          {/* Timestamp */}
          <p className="text-xs text-muted-foreground">
            {format(new Date(request.created_at), 'dd MMM yyyy, HH:mm')}
          </p>
        </CardContent>
      </Card>

      {/* Respond Dialog */}
      <Dialog open={showRespondDialog} onOpenChange={setShowRespondDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send quote</DialogTitle>
            <DialogDescription>
              Respond to this request with your quote and any details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Quoted amount (R)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="e.g. 5000"
                value={quotedAmount}
                onChange={(e) => setQuotedAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="response">Message</Label>
              <Textarea
                id="response"
                placeholder="Include what's covered, availability, terms..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRespondDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRespond} disabled={isSubmitting || !response.trim()}>
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Sending...' : 'Send quote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}