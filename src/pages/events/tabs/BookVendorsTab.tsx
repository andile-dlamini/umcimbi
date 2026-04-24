import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { EventType } from '@/types/database';
import { VendorCategory, VENDOR_CATEGORY_LABELS } from '@/lib/vendorCategories';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';

const CEREMONY_VENDOR_MAP: Partial<Record<EventType, VendorCategory[]>> = {
  lobola:           ['catering', 'transport'],
  umembeso:         ['catering', 'tents', 'decor', 'photographer', 'attire_tailoring', 'makeup_beauty', 'cold_room_hire', 'drinks_ice_delivery', 'mobile_toilets', 'dj_sound_audio'],
  umbondo:          ['catering', 'tents', 'decor', 'photographer', 'attire_tailoring', 'makeup_beauty', 'cold_room_hire', 'drinks_ice_delivery', 'mobile_toilets', 'dj_sound_audio'],
  umabo:            ['catering', 'tents', 'decor', 'photographer', 'attire_tailoring', 'makeup_beauty', 'cold_room_hire', 'drinks_ice_delivery', 'mobile_toilets', 'dj_sound_audio', 'livestock'],
  umemulo:          ['catering', 'tents', 'decor', 'photographer', 'attire_tailoring', 'makeup_beauty', 'cold_room_hire', 'drinks_ice_delivery', 'mobile_toilets', 'dj_sound_audio', 'livestock'],
  imbeleko:         ['catering', 'cold_room_hire', 'livestock'],
  ancestral_ritual: ['catering', 'cold_room_hire', 'livestock'],
};

type BookingStatus = 'not_started' | 'quote_requested' | 'quote_received' | 'deposit_due' | 'upcoming' | 'balance_due';

interface Props {
  eventId: string;
  eventType: EventType;
}

export function BookVendorsTab({ eventId, eventType }: Props) {
  const navigate = useNavigate();
  const [categoryStatus, setCategoryStatus] = useState<Record<string, BookingStatus>>({});
  const [isLoading, setIsLoading] = useState(true);

  const categories = CEREMONY_VENDOR_MAP[eventType] ?? [];

  useEffect(() => {
    const fetchStatus = async () => {
      const [{ data: serviceRequests }, { data: bookings }] = await Promise.all([
        supabase
          .from('service_requests')
          .select('status, vendor:vendors(category)')
          .eq('event_id', eventId),
        supabase
          .from('bookings')
          .select('booking_status, vendor:vendors(category)')
          .eq('event_id', eventId),
      ]);

      const statusMap: Record<string, BookingStatus> = {};

      for (const cat of categories) {
        const catBookings = (bookings || []).filter(
          (b: any) => b.vendor?.category === cat
        );
        const catRequests = (serviceRequests || []).filter(
          (r: any) => r.vendor?.category === cat
        );
        const depositDue = catBookings.some((b: any) => b.booking_status === 'pending_deposit');
        const balanceDue = catBookings.some((b: any) =>
          b.booking_status === 'confirmed' && b.balance_status === 'due'
        );
        const upcoming = catBookings.some((b: any) =>
          b.booking_status === 'confirmed' && b.balance_status !== 'due'
        );
        const quoteReceived = catRequests.some((r: any) => r.status === 'quoted');
        const quoteRequested = catRequests.some((r: any) => r.status === 'pending');

        if (depositDue) statusMap[cat] = 'deposit_due';
        else if (balanceDue) statusMap[cat] = 'balance_due';
        else if (upcoming) statusMap[cat] = 'upcoming';
        else if (quoteReceived) statusMap[cat] = 'quote_received';
        else if (quoteRequested) statusMap[cat] = 'quote_requested';
        else statusMap[cat] = 'not_started';
      }

      setCategoryStatus(statusMap);
      setIsLoading(false);
    };

    fetchStatus();
  }, [eventId, eventType]);

  if (categories.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No vendor checklist available for this ceremony type.
      </div>
    );
  }

  const orderedCount = isLoading
    ? 0
    : categories.filter(c => categoryStatus[c] === 'upcoming' || categoryStatus[c] === 'balance_due').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Vendors booked
        </h3>
        <span className="text-sm font-semibold">
          {orderedCount} / {categories.length}
        </span>
      </div>

      <div className="space-y-2">
        {categories.map(cat => {
          const status: BookingStatus = isLoading
            ? 'not_started'
            : (categoryStatus[cat] ?? 'not_started');

          const dotColor =
            status === 'deposit_due'    ? 'bg-orange-500' :
            status === 'balance_due'    ? 'bg-orange-500' :
            status === 'upcoming'       ? 'bg-blue-500'   :
            status === 'quote_received' ? 'bg-amber-400'  :
            status === 'quote_requested'? 'bg-amber-400'  :
                                          'bg-muted-foreground/30';
          const badgeClass =
            status === 'deposit_due'    ? 'bg-orange-50 text-orange-700 border-orange-200' :
            status === 'balance_due'    ? 'bg-orange-50 text-orange-700 border-orange-200' :
            status === 'upcoming'       ? 'bg-blue-50 text-blue-700 border-blue-200'       :
            status === 'quote_received' ? 'bg-amber-50 text-amber-700 border-amber-200'    :
                                          'bg-amber-50 text-amber-700 border-amber-200';
          const badgeLabel =
            status === 'deposit_due'    ? 'Deposit Due'     :
            status === 'balance_due'    ? 'Balance Due'     :
            status === 'upcoming'       ? 'Upcoming'        :
            status === 'quote_received' ? 'Quote Received'  :
            status === 'quote_requested'? 'Quote Requested' :
                                          '';

          return (
            <div
              key={cat}
              className="flex items-center justify-between p-3 bg-card border border-card-border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {VENDOR_CATEGORY_LABELS[cat]}
                  </span>
                  {badgeLabel && (
                    <Badge variant="outline" className={badgeClass}>
                      {badgeLabel}
                    </Badge>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/vendors?category=${cat}`)}
              >
                Find <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
