import { useState, useRef } from 'react';
import { Upload, Loader2, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface EftPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  kind: 'deposit' | 'balance';
  amount: number;
  offerNumber?: string | null;
  onSuccess: () => void;
}

export function EftPaymentDialog({ open, onOpenChange, bookingId, kind, amount, offerNumber, onSuccess }: EftPaymentDialogProps) {
  const { user } = useAuth();
  const [reference, setReference] = useState(offerNumber || '');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!file || !user) {
      toast.error('Please upload proof of payment');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload file to payment-proofs bucket
      const ext = file.name.split('.').pop() || 'bin';
      const filePath = `${bookingId}/${kind}-${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      // Create payment_proofs record
      const { error: insertError } = await supabase
        .from('payment_proofs')
        .insert({
          booking_id: bookingId,
          payer_user_id: user.id,
          kind,
          storage_key: filePath,
          reference_text: reference.trim() || null,
        });

      if (insertError) throw insertError;

      // Auto-confirm: mark payment as paid directly
      const updates: Record<string, any> = {};
      if (kind === 'deposit') {
        updates.deposit_status = 'paid';
        updates.deposit_paid_at = new Date().toISOString();
        updates.booking_status = 'confirmed';
        updates.balance_status = 'due';
        updates.balance_due_at = new Date().toISOString();
      } else {
        updates.balance_status = 'paid';
        updates.balance_paid_at = new Date().toISOString();
        updates.booking_status = 'completed';
      }
      await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId);

      // Post system message to conversation
      const { data: bk } = await supabase
        .from('bookings')
        .select('vendor_id, client_id')
        .eq('id', bookingId)
        .single();

      if (bk) {
        const { data: conv } = await supabase
          .from('conversations')
          .select('id')
          .eq('user_id', bk.client_id)
          .eq('vendor_id', bk.vendor_id)
          .order('last_message_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (conv) {
          const label = kind === 'deposit' ? 'Deposit' : 'Balance';
          await supabase.from('messages').insert({
            conversation_id: conv.id,
            sender_type: 'system' as any,
            sender_user_id: user.id,
            message_type: 'system',
            content: `✅ ${label} payment confirmed (R${amount.toLocaleString()}).${offerNumber ? ` Ref: ${offerNumber}` : ''}`,
          });
          await supabase.from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', conv.id);
        }
      }

      toast.success('Proof of payment submitted!');
      onSuccess();
    } catch (err) {
      console.error('EFT upload error:', err);
      toast.error('Failed to upload proof');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay {kind === 'deposit' ? 'Deposit' : 'Balance'} via EFT</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">Amount Due</p>
            <p className="text-2xl font-bold text-primary">R{amount?.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground">
              Transfer this amount via EFT and upload your proof of payment below.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Reference number (optional)</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. your bank reference"
            />
          </div>

          <div className="space-y-2">
            <Label>Proof of payment *</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {!file ? (
              <Button
                variant="outline"
                className="w-full border-dashed border-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload screenshot or PDF
              </Button>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm font-medium truncate flex-1">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, or PDF. Max 5MB.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!file || isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {isSubmitting ? 'Submitting...' : 'Submit Proof'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
