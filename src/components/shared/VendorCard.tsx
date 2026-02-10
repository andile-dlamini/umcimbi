import { useNavigate } from 'react-router-dom';
import { Star, MapPin, ChevronRight, Navigation } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Vendor } from '@/types/database';
import { VendorBadges } from '@/components/vendors/VendorBadges';
import { getVendorCategoryLabel } from '@/lib/vendorCategories';
import { formatDistance } from '@/lib/distanceUtils';
import { cn } from '@/lib/utils';

interface VendorCardProps {
  vendor: Vendor & { distanceKm?: number | null };
  eventId?: string;
  isSelected?: boolean;
  showDistance?: boolean;
}

export function VendorCard({ vendor, eventId, isSelected, showDistance = false }: VendorCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    const path = eventId 
      ? `/vendors/${vendor.id}?eventId=${eventId}`
      : `/vendors/${vendor.id}`;
    navigate(path);
  };

  const distanceKm = 'distanceKm' in vendor ? vendor.distanceKm : null;

  return (
    <Card 
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow tap-highlight-none border-card-border',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
            <img 
              src={vendor.image_urls?.[0] || '/placeholder.svg'} 
              alt={vendor.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="text-xs bg-accent/20 text-accent border-accent/50">
                {getVendorCategoryLabel(vendor.category)}
              </Badge>
              {isSelected && (
                <Badge className="text-xs bg-success text-success-foreground">
                  Selected
                </Badge>
              )}
            </div>
            
            <h3 className="font-semibold text-foreground truncate flex items-center gap-1">
              {vendor.name}
              <VendorBadges 
                businessVerificationStatus={(vendor as any).business_verification_status} 
                isSuperVendor={(vendor as any).is_super_vendor} 
              />
            </h3>
            
            <div className="flex items-center gap-3 mt-1 text-sm flex-wrap">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                <span className="font-medium">{vendor.rating}</span>
                <span className="text-muted-foreground">({vendor.review_count})</span>
              </div>
              
              {vendor.location && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{vendor.location}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1">
              {vendor.price_range_text && (
                <p className="text-sm text-primary font-medium">
                  {vendor.price_range_text}
                </p>
              )}
              
              {showDistance && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Navigation className="h-3 w-3" />
                  <span>{formatDistance(distanceKm)}</span>
                </div>
              )}
            </div>
          </div>
          
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
