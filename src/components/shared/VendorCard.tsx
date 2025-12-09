import { useNavigate } from 'react-router-dom';
import { Star, MapPin, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Vendor } from '@/types/database';
import { cn } from '@/lib/utils';

interface VendorCardProps {
  vendor: Vendor;
  eventId?: string;
  isSelected?: boolean;
}

const categoryLabels: Record<string, string> = {
  decor: 'Decor',
  catering: 'Catering',
  livestock: 'Livestock',
  tents: 'Tents',
  photographer: 'Photography',
  attire: 'Attire',
  transport: 'Transport',
  other: 'Other',
};

export function VendorCard({ vendor, eventId, isSelected }: VendorCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    const path = eventId 
      ? `/vendors/${vendor.id}?eventId=${eventId}`
      : `/vendors/${vendor.id}`;
    navigate(path);
  };

  return (
    <Card 
      className={cn(
        'cursor-pointer hover:shadow-shweshwe-lg transition-all tap-highlight-none overflow-hidden',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Image with decorative circle */}
          <div className="relative">
            <div className="w-16 h-16 rounded-xl bg-muted flex-shrink-0 overflow-hidden ring-2 ring-accent/20">
              <img 
                src={vendor.image_urls?.[0] || '/placeholder.svg'} 
                alt={vendor.name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Small decorative circle */}
            <div className="absolute -right-1 -bottom-1 w-4 h-4 rounded-full bg-gradient-to-br from-primary via-accent to-secondary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs capitalize border-secondary/30 text-secondary">
                {categoryLabels[vendor.category] || vendor.category}
              </Badge>
              {isSelected && (
                <Badge className="text-xs bg-success text-success-foreground">
                  Selected
                </Badge>
              )}
            </div>
            
            <h3 className="font-semibold text-foreground truncate">
              {vendor.name}
            </h3>
            
            <div className="flex items-center gap-3 mt-1 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-accent text-accent" />
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
            
            {vendor.price_range_text && (
              <p className="text-sm text-secondary font-medium mt-1">
                {vendor.price_range_text}
              </p>
            )}
          </div>
          
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}