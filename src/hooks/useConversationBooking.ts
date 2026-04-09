import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useConversationBooking(
  conversationId: string | undefined,
  vendorId: string | undefined,
  clientUserId: string | undefined
) {
  const [booking, setBooking] = useState<any>(null);
  const [deliveryProofs, setDeliveryProofs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBooking = async () => {
    if (!vendorId || !clientUserId) return;
    setIsLoading(true);

    const { data } = await supabase
      .from('bookings')
      .select('id, booking_status, balance_status, balance_amount, funds_released_at, client_confirmed_at, dispute_raised_at')
      .eq('vendor_id', vendorId)
      .eq('client_id', clientUserId)
      .in('booking_status', ['confirmed', 'disputed', 'completed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setBooking(data);

      const { data: proofs } = await supabase
        .from('delivery_proofs')
        .select('id, created_at, photos')
        .eq('booking_id', data.id)
        .order('created_at', { ascending: false });

      setDeliveryProofs(proofs || []);
    } else {
      setBooking(null);
      setDeliveryProofs([]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchBooking();
  }, [vendorId, clientUserId]);

  return { booking, deliveryProofs, isLoading, refreshBooking: fetchBooking };
}
