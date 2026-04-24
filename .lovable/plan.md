# Plan: Replace Vendors Tab with Book Vendors Tab

## Summary
Replace the existing "Vendors" tab in the event dashboard with a new "Book Vendors" tab that provides a ceremony-specific vendor checklist with booking-status tracking, plus deep-link support from the checklist into the vendor list filtered by category.

## Changes

### File 1 — CREATE `src/pages/events/tabs/BookVendorsTab.tsx`

Create this file with exactly this content:

```tsx
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

type BookingStatus = 'not_started' | 'in_progress' | 'ordered';

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
          (b: any) => b.vendor?.category === cat &&
            ['confirmed', 'completed'].includes(b.booking_status)
        );
        const catRequests = (serviceRequests || []).filter(
          (r: any) => r.vendor?.category === cat
        );
        const hasOrdered =
          catBookings.length > 0 ||
          catRequests.some((r: any) => r.status === 'accepted');
        const hasInProgress = catRequests.some((r: any) =>
          ['pending', 'quoted', 'adjustment_requested'].includes(r.status)
        );

        statusMap[cat] = hasOrdered ? 'ordered' : hasInProgress ? 'in_progress' : 'not_started';
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
    : categories.filter(c => categoryStatus[c] === 'ordered').length;

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
            status === 'ordered'     ? 'bg-emerald-500' :
            status === 'in_progress' ? 'bg-amber-400'   :
                                       'bg-muted-foreground/30';
          const badgeClass =
            status === 'ordered'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200';
          const badgeLabel =
            status === 'ordered'     ? 'Ordered'     :
            status === 'in_progress' ? 'In progress' :
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
```

### File 2 — MODIFY `src/pages/vendors/VendorsList.tsx`

Replace:
```typescript
import { useState } from 'react';
```

With:
```typescript
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
```

Replace:
```typescript
  const [category, setCategory] = useState<VendorCategory | 'all'>('all');
```

With:
```typescript
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState<VendorCategory | 'all'>(
    (searchParams.get('category') as VendorCategory) || 'all'
  );
```

Do not change anything else in this file.

### File 3 — MODIFY `src/pages/events/EventDashboard.tsx`

Replace:
```typescript
import { VendorsTab } from './tabs/VendorsTab';
```

With:
```typescript
import { BookVendorsTab } from './tabs/BookVendorsTab';
```

Replace:
```tsx
                Vendors
              </TabsTrigger>
              {guide && (
```

With:
```tsx
                Book Vendors
              </TabsTrigger>
              {guide && (
```

Replace:
```tsx
            <VendorsTab eventId={event.id} location={event.location || ''} />
```

With:
```tsx
            <BookVendorsTab eventId={event.id} eventType={event.event_type} />
```

Do not change anything else in this file.

## Notes
- `BookVendorsTab` uses `Record<string, BookingStatus>` for both the state and the local `statusMap`, as requested.
- Deep linking from each row uses `/vendors?category=<cat>`; `VendorsList` initializes its category filter from that query param.
- The `CEREMONY_VENDOR_MAP` covers all 7 supported ceremonies; any unmapped event type renders the empty-state message.
