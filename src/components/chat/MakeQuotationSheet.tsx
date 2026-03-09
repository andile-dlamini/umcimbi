import { useState } from 'react';
import { Plus, Minus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

interface MakeQuotationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  eventName?: string;
  eventDate?: string;
  eventLocation?: string;
  onSuccess?: () => void;
}

export function MakeQuotationSheet({
  open,
  onOpenChange,
  conversationId,
  eventName,
  eventDate,
  eventLocation,
  onSuccess,
}: MakeQuotationSheetProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0 },
  ]);
  const [depositPercentage, setDepositPercentage] = useState(50);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    if (field === 'description') {
      updated[index].description = value as string;
    } else if (field === 'quantity') {
      updated[index].quantity = Math.max(1, Number(value) || 1);
    } else {
      updated[index].unit_price = Math.max(0, Number(value) || 0);
    }
    setLineItems(updated);
  };

  const PLATFORM_FEE_RATE = 0.08;
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const platformFee = subtotal * PLATFORM_FEE_RATE;
  const clientTotal = subtotal + platformFee;
  const depositAmount = clientTotal * (depositPercentage / 100);

  const handleSubmit = async () => {
    const validItems = lineItems.filter(i => i.description.trim() && i.unit_price > 0);
    if (validItems.length === 0) {
      toast.error('Add at least one line item with description and price');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-quote', {
        body: {
          conversation_id: conversationId,
          deposit_percentage: depositPercentage,
          notes: notes.trim() || null,
          line_items: validItems.map((item, idx) => ({
            description: item.description.trim(),
            quantity: item.quantity,
            unit_price: item.unit_price,
            sort_order: idx,
          })),
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success(`Quotation ${data.offer_number} sent!`);
      onOpenChange(false);
      // Reset form
      setLineItems([{ description: '', quantity: 1, unit_price: 0 }]);
      setDepositPercentage(50);
      setNotes('');
      onSuccess?.();
    } catch (err) {
      console.error('Error sending quote:', err);
      toast.error('Failed to send quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) =>
    `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Make Quotation</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {/* Event context */}
          {eventName && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium">{eventName}</p>
              {eventDate && <p className="text-xs text-muted-foreground">{eventDate}</p>}
              {eventLocation && <p className="text-xs text-muted-foreground">{eventLocation}</p>}
            </div>
          )}

          {/* Line items */}
          <div>
            <Label className="text-sm font-medium">Line Items</Label>
            <div className="space-y-3 mt-2">
              {lineItems.map((item, index) => (
                <div key={index} className="space-y-2 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Description (e.g. Chairs)"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      className="flex-1"
                    />
                    {lineItems.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => removeLineItem(index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Qty</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Unit Price (R)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unit_price || ''}
                        onChange={(e) => updateLineItem(index, 'unit_price', e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-right text-muted-foreground">
                    Subtotal: {formatCurrency(item.quantity * item.unit_price)}
                  </p>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-2 w-full" onClick={addLineItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add line item
            </Button>
          </div>

          <Separator />

          {/* Deposit percentage */}
          <div>
            <Label>Deposit %</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={depositPercentage}
              onChange={(e) => setDepositPercentage(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
            />
          </div>

          {/* Notes */}
          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Terms, availability, inclusions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Separator />

          {/* Totals */}
          <div className="bg-primary/5 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Client pays</span>
              <span className="text-lg font-bold">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Deposit ({depositPercentage}%)</span>
              <span className="font-medium">{formatCurrency(depositAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Balance ({100 - depositPercentage}%)</span>
              <span className="font-medium">{formatCurrency(total - depositAmount)}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Platform fee (8%)</span>
              <span className="font-medium text-destructive">−{formatCurrency(platformFee)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-emerald-600">You receive</span>
              <span className="font-medium text-emerald-600">{formatCurrency(vendorPayout)}</span>
            </div>
          </div>
        </div>

        <SheetFooter className="mt-4">
          <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting || total === 0}>
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
            ) : (
              'Send Quotation'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
