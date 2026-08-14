import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  Heart,
  Star,
  MapPin,
  Briefcase,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Facebook,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useVendor } from '@/hooks/useVendors';
import { useStartConversation } from '@/hooks/useChat';
import { useAuth } from '@/context/AuthContext';
import { VendorRating } from '@/components/vendors/VendorRating';
import { VendorBadges } from '@/components/vendors/VendorBadges';
import { getVendorCategoryLabel, truncateVendorCategories } from '@/lib/vendorCategories';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEvents } from '@/hooks/useEvents';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.14V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.93a8.16 8.16 0 0 0 4.77 1.52V7a4.85 4.85 0 0 1-1.84-.31z" />
  </svg>
);

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  const navigate = useNavigate();

  const { user } = useAuth();
  const { vendor, isLoading } = useVendor(id);
  const { startConversation } = useStartConversation();
  const { events } = useEvents();

  const [selectedEventId, setSelectedEventId] = useState(eventId || '');
  const [isSaved, setIsSaved] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    if (!user || !id) return;
    let cancelled = false;
    supabase
      .from('saved_vendors')
      .select('id')
      .eq('user_id', user.id)
      .eq('vendor_id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setIsSaved(!!data);
      });
    return () => {
      cancelled = true;
    };
  }, [user, id]);

  useEffect(() => {
    if (galleryOpen) setGalleryIndex(0);
  }, [galleryOpen]);

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

  const handleToggleSaved = async () => {
    if (!user) {
      toast.error('Please log in to save vendors');
      return;
    }
    if (!id) return;
    if (isSaved) {
      const { error } = await supabase
        .from('saved_vendors')
        .delete()
        .eq('user_id', user.id)
        .eq('vendor_id', id);
      if (error) {
        toast.error('Could not unsave vendor');
        return;
      }
      setIsSaved(false);
    } else {
      const { error } = await supabase
        .from('saved_vendors')
        .insert({ user_id: user.id, vendor_id: id });
      if (error) {
        toast.error('Could not save vendor');
        return;
      }
      setIsSaved(true);
      toast.success('Vendor saved');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: vendor?.name || 'Vendor',
      text: vendor?.name ? `Check out ${vendor.name} on UMCIMBI` : 'Check out this vendor on UMCIMBI',
      url,
    };
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share(shareData);
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not share link');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading vendor...</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-muted-foreground">This vendor doesn't exist.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    );
  }

  const galleryImages = vendor.image_urls ?? [];
  const allImages =
    vendor.logo_url && !galleryImages.includes(vendor.logo_url)
      ? [vendor.logo_url, ...galleryImages]
      : galleryImages;
  const logoUrl = vendor.logo_url ?? allImages[0] ?? null;
  const images = allImages;
  const totalImages = images.length;
  const v = vendor as any;
  const instagramUrl: string | null = v.instagram_url ?? null;
  const tiktokUrl: string | null = v.tiktok_url ?? null;
  const facebookUrl: string | null = v.facebook_url ?? null;
  const hasSocial = !!(instagramUrl || tiktokUrl || facebookUrl);

  const PhotoCell = ({ index, className }: { index: number; className?: string }) => {
    const url = images[index];
    return (
      <div
        className={cn(
          'bg-muted overflow-hidden flex items-center justify-center',
          className,
        )}
      >
        {url ? (
          <img
            src={url}
            alt={`${vendor.name} photo ${index + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <Camera className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
    );
  };

  const circleBtn =
    'inline-flex items-center justify-center h-10 w-10 rounded-full bg-background/95 shadow-md backdrop-blur-sm hover:bg-background transition-colors';

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-2xl mx-auto w-full">
      {/* Photo grid with floating topbar */}
      <div className="relative">
        {/* Floating topbar */}
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between">
          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate(-1)}
            className={circleBtn}
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Share"
              onClick={handleShare}
              className={circleBtn}
            >
              <Share2 className="h-5 w-5 text-foreground" />
            </button>
            <button
              type="button"
              aria-label={isSaved ? 'Unsave vendor' : 'Save vendor'}
              onClick={handleToggleSaved}
              className={circleBtn}
            >
              <Heart
                className={cn(
                  'h-5 w-5',
                  isSaved ? 'text-destructive fill-destructive' : 'text-foreground',
                )}
              />
            </button>
          </div>
        </div>

        {/* 3-cell grid */}
        <div className="relative h-[240px] grid grid-cols-2 grid-rows-2 gap-1">
          <PhotoCell index={0} className="row-span-2 h-[240px]" />
          <PhotoCell index={1} className="h-[120px]" />
          <PhotoCell index={2} className="h-[120px]" />

          {totalImages > 3 && (
            <button
              type="button"
              onClick={() => setGalleryOpen(true)}
              className="absolute bottom-3 right-3 z-10 rounded-full bg-background/95 backdrop-blur-sm shadow-md px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background transition-colors"
            >
              Show all {totalImages} photos
            </button>
          )}
        </div>
      </div>

      {/* Vendor info block */}
      <div className="px-3 py-3.5">
        <div className="flex items-center gap-3 mb-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={vendor.name}
              className="h-12 w-12 rounded-full object-cover flex-shrink-0 border border-border"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-primary-foreground">
                {vendor.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <h1
          className="text-foreground leading-tight font-medium"
          style={{ fontSize: '18px' }}
        >
          {vendor.name}
        </h1>

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="secondary">
            {(() => {
              const { text, more } = truncateVendorCategories(vendor as any, 2);
              return (
                <>
                  {text}
                  {more > 0 && <span className="opacity-70">{` +${more}`}</span>}
                </>
              );
            })()}
          </Badge>
          <VendorBadges
            businessVerificationStatus={v.business_verification_status}
            isSuperVendor={v.is_super_vendor}
            size="md"
          />
        </div>

        <div className="flex items-center gap-4 text-sm mt-2 flex-wrap">
          {(vendor.review_count ?? 0) > 0 && vendor.rating != null && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="font-medium text-foreground">
                {Number(vendor.rating ?? 0).toFixed(1)}
              </span>
              <span className="text-muted-foreground">
                ({vendor.review_count ?? 0} reviews)
              </span>
            </div>
          )}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Briefcase className="h-4 w-4" />
            <span>{vendor.added_to_events_count ?? 0} events</span>
          </div>
          {vendor.location && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{vendor.location}</span>
            </div>
          )}
        </div>
      </div>

      {vendor.price_range_text && (
        <>
          <hr className="border-border" />
          <div className="px-3 py-3.5">
            <p className="text-sm text-muted-foreground mb-0.5">Price range</p>
            <p className="text-primary font-medium">{vendor.price_range_text}</p>
          </div>
        </>
      )}

      {vendor.about && (
        <>
          <hr className="border-border" />
          <div className="px-3 py-3.5">
            <h2 className="font-semibold text-foreground mb-1.5">About</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {vendor.about}
            </p>
          </div>
        </>
      )}

      {hasSocial && (
        <>
          <hr className="border-border" />
          <div className="px-3 py-3.5">
            <p className="text-sm text-muted-foreground mb-2">Find us on social</p>
            <div className="flex items-center gap-3">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="inline-flex items-center justify-center h-10 w-10 rounded-full border-2 border-pink-500 text-pink-500 hover:bg-pink-500/10 transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {tiktokUrl && (
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="inline-flex items-center justify-center h-10 w-10 rounded-full border-2 border-foreground text-foreground hover:bg-foreground/10 transition-colors"
                >
                  <TikTokIcon className="h-5 w-5" />
                </a>
              )}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="inline-flex items-center justify-center h-10 w-10 rounded-full border-2 border-blue-600 text-blue-600 hover:bg-blue-600/10 transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </>
      )}

      <hr className="border-border" />

      {/* Reviews */}
      <div className="px-3 py-3.5">
        <VendorRating vendorId={id!} />
      </div>

      {/* Spacer so CTA never overlaps content */}
      <div className="pb-[100px]" />

      {/* Floating CTA bar */}
      <div className="sticky bottom-0 inset-x-0 z-30 bg-background border-t border-border px-3 py-3 space-y-2">
        {events.length > 0 && (
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger>
              <SelectValue placeholder="Link to an event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((evt) => (
                <SelectItem key={evt.id} value={evt.id}>
                  {evt.name}
                </SelectItem>
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
          Ask for quotation
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Vendor will receive your event details
        </p>
      </div>

      {/* Full-screen gallery overlay */}
      {galleryOpen && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col">
          {/* Top bar */}
          <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3">
            <div className="text-sm font-medium text-foreground">
              {galleryIndex + 1} / {images.length}
            </div>
            <button
              type="button"
              aria-label="Close gallery"
              onClick={() => setGalleryOpen(false)}
              className={circleBtn}
            >
              <X className="h-5 w-5 text-foreground" />
            </button>
          </div>

          {/* Main image area */}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
            {images.length > 1 && (
              <button
                type="button"
                aria-label="Previous photo"
                onClick={() =>
                  setGalleryIndex((prev) => (prev - 1 + images.length) % images.length)
                }
                className={cn(circleBtn, 'absolute left-4 md:left-8 top-1/2 -translate-y-1/2')}
              >
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
            )}

            <div className="max-h-[70vh] max-w-full rounded-xl overflow-hidden">
              <img
                src={images[galleryIndex]}
                alt={`${vendor.name} photo ${galleryIndex + 1}`}
                className="max-h-[70vh] max-w-full object-contain"
                onClick={() =>
                  setGalleryIndex((prev) => (prev + 1) % images.length)
                }
              />
            </div>

            {images.length > 1 && (
              <button
                type="button"
                aria-label="Next photo"
                onClick={() =>
                  setGalleryIndex((prev) => (prev + 1) % images.length)
                }
                className={cn(circleBtn, 'absolute right-4 md:right-8 top-1/2 -translate-y-1/2')}
              >
                <ChevronRight className="h-5 w-5 text-foreground" />
              </button>
            )}
          </div>

          {/* Caption */}
          <div className="px-4 py-4 text-center text-sm text-muted-foreground">
            {vendor.name} photo {galleryIndex + 1}
          </div>
        </div>
      )}
    </div>
  );
}
