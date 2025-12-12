import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VendorCard } from '@/components/shared/VendorCard';
import { useEventVendors } from '@/hooks/useEvents';
import { useVendors } from '@/hooks/useVendors';

interface VendorsTabProps {
  eventId: string;
  location: string;
}

export function VendorsTab({ eventId, location }: VendorsTabProps) {
  const [search, setSearch] = useState('');
  const { eventVendors, removeVendorFromEvent, isVendorSelected } = useEventVendors(eventId);
  // Don't filter by location - show all vendors so users can find relevant ones
  const { vendors } = useVendors({ search });

  const selectedVendors = vendors.filter(v => isVendorSelected(v.id));
  const availableVendors = vendors.filter(v => !isVendorSelected(v.id));

  return (
    <div className="space-y-6">
      {/* Selected Vendors */}
      {selectedVendors.length > 0 && (
        <section>
          <h3 className="font-semibold text-foreground mb-3">My Selected Vendors</h3>
          <div className="space-y-3">
            {selectedVendors.map((vendor) => (
              <Card key={vendor.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="text-xs mb-1 capitalize">
                        {vendor.category}
                      </Badge>
                      <p className="font-medium text-foreground truncate">{vendor.name}</p>
                      <p className="text-sm text-muted-foreground">{vendor.location}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeVendorFromEvent(vendor.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Available Vendors */}
      <section>
        <h3 className="font-semibold text-foreground mb-3">
          {location ? `Vendors near ${location}` : 'Available Vendors'}
        </h3>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-3">
          {availableVendors.map((vendor) => (
            <VendorCard 
              key={vendor.id} 
              vendor={vendor} 
              eventId={eventId}
              isSelected={isVendorSelected(vendor.id)}
            />
          ))}

          {availableVendors.length === 0 && (
            <p className="text-center text-muted-foreground py-6">
              {search ? 'No vendors match your search' : 'All vendors selected'}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
