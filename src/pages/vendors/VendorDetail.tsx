import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, Phone, MessageCircle, Check, Send, FileText, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { useVendor } from '@/hooks/useVendors';
import { useEventVendors } from '@/hooks/useEvents';
import { useStartConversation } from '@/hooks/useChat';
import { useAuth } from '@/context/AuthContext';
import { VendorRating } from '@/components/vendors/VendorRating';
import { VendorBadges } from '@/components/vendors/VendorBadges';
import { getVendorCategoryLabel } from '@/lib/vendorCategories';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEvents } from '@/hooks/useEvents';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const navigate = useNavigate();
  
  const { user } = useAuth();
  const { vendor, isLoading } = useVendor(id);
  const { addVendorToEvent, removeVendorFromEvent, isVendorSelected } = useEventVendors(eventId || undefined);
  const { startConversation } = useStartConversation();
  const { events } = useEvents();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedEventId, setSelectedEventId] = useState(eventId || '');

  const isSelected = id ? isVendorSelected(id) : false;
  const displayImage = vendor?.image_urls?.[selectedImageIndex] || vendor?.image_urls?.[0] || '/placeholder.svg';

  const handleChatWithVendor = async () => {
    if (!user) {
      toast.error('Please log in to chat with vendors');
      navigate('/auth');
      return;
    }

    if (!id) return;

    const conversationId = await startConversation(id, selectedEventId || undefined);
    if (conversationId) {
      navigate(`/chat/${conversationId}`);
    } else {
      toast.error('Could not start conversation');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-safe">
        <PageHeader title="Loading..." showBack />
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading vendor...</p>
        </div>
      </div>
    );
  }

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
    if (!eventId || !id) return;
    
    if (isSelected) {
      removeVendorFromEvent(id);
    } else {
      addVendorToEvent(id);
    }
  };

  const whatsappLink = vendor.whatsapp_number 
    ? `https://wa.me/${vendor.whatsapp_number.replace(/\D/g, '')}`
    : null;

  return (
    <div className="min-h-screen pb-safe">
      <PageHeader title={vendor.name} showBack />

      {/* Hero Image */}
      <div className="aspect-video bg-muted">
        <img
          src={displayImage}
          alt={vendor.name}
          className="w-full h-full object-contain transition-opacity duration-200"
        />
      </div>

      {/* Gallery Thumbnails */}
      {vendor.image_urls && vendor.image_urls.length > 1 && (
        <div className="px-4 pt-4">
          <div className="grid grid-cols-4 gap-2 max-w-lg mx-auto">
            {vendor.image_urls.slice(0, 4).map((url, index) => (
              <div 
                key={index} 
                onClick={() => setSelectedImageIndex(index)}
                className={cn(
                  "aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer transition-all duration-200",
                  selectedImageIndex === index 
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
                    : "hover:opacity-80"
                )}
              >
                <img 
                  src={url} 
                  alt={`${vendor.name} gallery ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Header Info */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary">
              {getVendorCategoryLabel(vendor.category)}
            </Badge>
            {isSelected && (
              <Badge className="bg-success text-success-foreground">
                <Check className="h-3 w-3 mr-1" />
                Selected
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Vendor Logo */}
            <div className="w-14 h-14 rounded-full bg-muted border border-card-border flex-shrink-0 overflow-hidden flex items-center justify-center">
              {vendor.image_urls?.[0] ? (
                <img src={vendor.image_urls[0]} alt={`${vendor.name} logo`} className="w-full h-full object-cover" />
              ) : (
                <Store className="h-6 w-6 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-2xl font-bold text-foreground leading-tight">{vendor.name}</h1>
                <VendorBadges 
                  businessVerificationStatus={(vendor as any).business_verification_status}
                  isSuperVendor={(vendor as any).is_super_vendor}
                  size="md"
                />
              </div>
              <div className="flex items-center gap-4 text-sm mt-1 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span className="font-medium">{vendor.rating}</span>
                  <span className="text-muted-foreground">({vendor.review_count} reviews)</span>
                </div>
                {(vendor as any).jobs_completed > 0 && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span>{(vendor as any).jobs_completed} jobs done</span>
                  </div>
                )}
                {vendor.location && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{vendor.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Price */}
        {vendor.price_range_text && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Price Range</p>
              <p className="text-xl font-bold text-primary">{vendor.price_range_text}</p>
            </CardContent>
          </Card>
        )}

        {/* About */}
        {vendor.about && (
          <div>
            <h2 className="font-semibold text-foreground mb-2">About</h2>
            <p className="text-muted-foreground leading-relaxed">{vendor.about}</p>
          </div>
        )}

        {/* Languages */}
        {vendor.languages && vendor.languages.length > 0 && (
          <div>
            <h2 className="font-semibold text-foreground mb-2">Languages</h2>
            <div className="flex flex-wrap gap-2">
              {vendor.languages.map((lang) => (
                <Badge key={lang} variant="outline">{lang}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <VendorRating vendorId={id!} />

        {/* Event selector + Start Chat */}
        <div className="space-y-3">
          {events.length > 0 && (
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Link to an event (optional)" />
              </SelectTrigger>
              <SelectContent>
                {events.map((evt) => (
                  <SelectItem key={evt.id} value={evt.id}>{evt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            size="lg"
            className="w-full"
            variant="default"
            onClick={handleChatWithVendor}
          >
            <Send className="h-4 w-4 mr-2" />
            Start Chat
          </Button>
        </div>


        {/* Contact Actions */}
        <div className="flex gap-3">
          {vendor.phone_number && (
            <Button
              variant="outline"
              className="flex-1"
              asChild
            >
              <a href={`tel:${vendor.phone_number}`}>
                <Phone className="h-4 w-4 mr-2" />
                Call
              </a>
            </Button>
          )}
          
          {whatsappLink && (
            <Button
              className="flex-1 bg-success hover:bg-success/90"
              asChild
            >
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </a>
            </Button>
          )}
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