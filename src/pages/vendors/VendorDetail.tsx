import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, Phone, MessageCircle, Check, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { useVendor } from '@/hooks/useVendors';
import { useEventVendors } from '@/hooks/useEvents';
import { useStartConversation } from '@/hooks/useChat';
import { useAuth } from '@/context/AuthContext';
import { VendorRating } from '@/components/vendors/VendorRating';
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

  const isSelected = id ? isVendorSelected(id) : false;

  const handleChatWithVendor = async () => {
    if (!user) {
      toast.error('Please log in to chat with vendors');
      navigate('/auth');
      return;
    }

    if (!id) return;

    const conversationId = await startConversation(id, eventId || undefined);
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
          src={vendor.image_urls?.[0] || '/placeholder.svg'}
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
              <span className="text-muted-foreground">({vendor.review_count} reviews)</span>
            </div>
            
            {vendor.location && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{vendor.location}</span>
              </div>
            )}
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

        {/* Chat with Vendor Button */}
        <Button
          size="lg"
          className="w-full"
          variant="default"
          onClick={handleChatWithVendor}
        >
          <Send className="h-4 w-4 mr-2" />
          Chat with this vendor
        </Button>

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
