import { useParams, useSearchParams } from 'react-router-dom';
import { Star, MapPin, Phone, MessageCircle, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { useApp } from '@/context/AppContext';
import { sampleVendors } from '@/data/vendors';
import { cn } from '@/lib/utils';

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  
  const { events, addVendorToEvent, removeVendorFromEvent } = useApp();

  const vendor = sampleVendors.find(v => v.id === id);
  const event = eventId ? events.find(e => e.id === eventId) : null;
  const isSelected = event?.selectedVendorIds.includes(id || '') || false;

  if (!vendor) {
    return (
      <div className="min-h-screen pb-safe">
        <PageHeader title="Vendor not found" showBack />
        <div className="px-4 py-12 text-center">
          <p className="text-muted-foreground">This vendor doesn't exist.</p>
        </div>
      </div>
    );
  }

  const handleToggleVendor = () => {
    if (!eventId) return;
    
    if (isSelected) {
      removeVendorFromEvent(eventId, vendor.id);
    } else {
      addVendorToEvent(eventId, vendor.id);
    }
  };

  return (
    <div className="min-h-screen pb-safe">
      <PageHeader title={vendor.name} showBack />

      {/* Hero Image */}
      <div className="aspect-video bg-muted">
        <img
          src={vendor.imageUrls[0] || '/placeholder.svg'}
          alt={vendor.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Header Info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="capitalize">
              {vendor.category}
            </Badge>
            {isSelected && (
              <Badge className="bg-success text-success-foreground">
                <Check className="h-3 w-3 mr-1" />
                Selected
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">{vendor.name}</h1>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="font-medium">{vendor.rating}</span>
              <span className="text-muted-foreground">({vendor.reviewCount} reviews)</span>
            </div>
            
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{vendor.location}</span>
            </div>
          </div>
        </div>

        {/* Price */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Price Range</p>
            <p className="text-xl font-bold text-primary">{vendor.priceRangeText}</p>
          </CardContent>
        </Card>

        {/* About */}
        <div>
          <h2 className="font-semibold text-foreground mb-2">About</h2>
          <p className="text-muted-foreground leading-relaxed">{vendor.about}</p>
        </div>

        {/* Contact Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            asChild
          >
            <a href={`tel:${vendor.phoneNumber}`}>
              <Phone className="h-4 w-4 mr-2" />
              Call
            </a>
          </Button>
          
          <Button
            className="flex-1 bg-success hover:bg-success/90"
            asChild
          >
            <a href={vendor.whatsappLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </a>
          </Button>
        </div>

        {/* Add to Event */}
        {eventId && (
          <Button
            size="lg"
            className={cn(
              'w-full',
              isSelected && 'bg-muted text-muted-foreground hover:bg-muted'
            )}
            onClick={handleToggleVendor}
          >
            {isSelected ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Added to event
              </>
            ) : (
              'Add to event'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}