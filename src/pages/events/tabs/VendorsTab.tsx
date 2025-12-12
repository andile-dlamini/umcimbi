import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Vendor, Event } from '@/types/database';
import { getVendorCategoryLabel } from '@/lib/vendorCategories';
import { getDistanceInKm, formatDistance } from '@/lib/distanceUtils';
import { Star, ExternalLink, Navigation, ArrowUpDown } from 'lucide-react';

interface VendorsTabProps {
  eventId: string;
  location: string;
}

interface BookedVendor {
  vendor: Vendor;
  booking_status: string;
  agreed_price: number;
  distanceKm: number | null;
}

type SortOption = 'distance' | 'rating' | 'name' | 'price';

export function VendorsTab({ eventId }: VendorsTabProps) {
  const navigate = useNavigate();
  const [bookedVendors, setBookedVendors] = useState<BookedVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('rating');

  useEffect(() => {
    const fetchData = async () => {
      // Fetch event coordinates
      const { data: eventData } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .maybeSingle();
      
      setEvent(eventData as Event | null);

      // Fetch booked vendors
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          booking_status,
          agreed_price,
          vendor:vendors(*)
        `)
        .eq('event_id', eventId);

      if (error) {
        console.error('Error fetching booked vendors:', error);
      } else if (data) {
        const vendors = data
          .filter(b => b.vendor)
          .map(b => {
            const vendor = b.vendor as unknown as Vendor;
            return {
              vendor,
              booking_status: b.booking_status,
              agreed_price: b.agreed_price,
              distanceKm: getDistanceInKm(
                eventData?.latitude,
                eventData?.longitude,
                vendor.latitude,
                vendor.longitude
              ),
            };
          });
        setBookedVendors(vendors);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [eventId]);

  // Sort vendors
  const sortedVendors = [...bookedVendors].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        if (a.distanceKm === null && b.distanceKm === null) return 0;
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      case 'name':
        return a.vendor.name.localeCompare(b.vendor.name);
      case 'price':
        return a.agreed_price - b.agreed_price;
      case 'rating':
      default:
        return (b.vendor.rating || 0) - (a.vendor.rating || 0);
    }
  });

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending_deposit: { label: 'Awaiting Deposit', variant: 'secondary' },
    confirmed: { label: 'Confirmed', variant: 'default' },
    completed: { label: 'Completed', variant: 'outline' },
    cancelled: { label: 'Cancelled', variant: 'destructive' },
    disputed: { label: 'Disputed', variant: 'destructive' },
  };

  const hasEventCoordinates = event?.latitude != null && event?.longitude != null;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 h-24" />
          </Card>
        ))}
      </div>
    );
  }

  if (bookedVendors.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No vendors booked for this event yet</p>
        <Button onClick={() => navigate('/vendors')}>
          Browse Vendors
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Booked Vendors</h3>
        
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[140px]">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="distance">Distance</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="price">Price</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-3">
        {sortedVendors.map(({ vendor, booking_status, agreed_price, distanceKm }) => {
          const status = statusConfig[booking_status] || { label: booking_status, variant: 'outline' as const };
          
          return (
            <Card key={vendor.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {vendor.image_urls?.[0] && (
                    <img 
                      src={vendor.image_urls[0]} 
                      alt={vendor.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {getVendorCategoryLabel(vendor.category)}
                      </Badge>
                      <Badge variant={status.variant} className="text-xs">
                        {status.label}
                      </Badge>
                    </div>
                    <p className="font-medium text-foreground truncate">{vendor.name}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {vendor.rating?.toFixed(1) || 'New'}
                      </span>
                      <span>R{agreed_price.toLocaleString()}</span>
                      {hasEventCoordinates && (
                        <span className="flex items-center gap-1">
                          <Navigation className="h-3 w-3" />
                          {formatDistance(distanceKm)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => navigate(`/vendors/${vendor.id}`)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
