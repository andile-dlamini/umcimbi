import { useState, useEffect } from 'react';
import { trackEvent } from '@/lib/trackEvent';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { Search, ArrowUpDown, BadgeCheck, Star, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/layout/PageHeader';
import { VendorCard } from '@/components/shared/VendorCard';
import { useVendorsWithDistance, SortOption } from '@/hooks/useVendorsWithDistance';
import { useEvents } from '@/hooks/useEvents';
import { LIVE_VENDOR_CATEGORY_FILTER_OPTIONS, VendorCategory } from '@/lib/vendorCategories';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LocationCombobox, LocationSelection } from '@/components/vendors/LocationCombobox';


export default function VendorsList() {
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState<VendorCategory | 'all'>(
    (searchParams.get('category') as VendorCategory) || 'all'
  );
  const [locationSelection, setLocationSelection] = useState<LocationSelection | null>(null);
  const [typedLocation, setTypedLocation] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [superVendorsOnly, setSuperVendorsOnly] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const { events } = useEvents();
  const { user } = useAuth();
  const { toast } = useToast();
  const { vendors, isLoading, sortBy, setSortBy, hasEventCoordinates } = useVendorsWithDistance(
    selectedEventId || undefined,
    { 
      category, 
      regionId: locationSelection?.regionId ?? null,
      search,
      verifiedOnly,
      superVendorsOnly,
    }
  );

  const [needInput, setNeedInput] = useState('');
  const [whereInput, setWhereInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);


  useEffect(() => { setPage(1); }, [search, category, locationSelection?.regionId, verifiedOnly, superVendorsOnly]);

  const handleUnmetDemandSubmit = async () => {
    setValidationError(null);
    const need = needInput.trim();
    const where = whereInput.trim();

    if (!need) {
      setValidationError('Please tell us what you need.');
      return;
    }

    const message = `Needs: ${need} | Where: ${where || 'not specified'} | Filters — category: ${category === 'all' ? 'all' : category}, location: ${locationSelection?.label || typedLocation || 'none'}, search: ${search || 'none'}`;

    if (message.length < 10 || message.length > 2000) {
      setValidationError('Please keep your request between 10 and 2000 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('send-feedback', {
        body: {
          feedback_type: 'unmet_demand',
          message,
          page_url: window.location.origin + location.pathname,
          user_agent: navigator.userAgent,
        },
      });
      if (error) throw error;
      toast({
        title: 'Thank you!',
        description: 'We got your request and will follow up.',
      });
      setNeedInput('');
      setWhereInput('');
    } catch (err: any) {
      console.error('unmet demand submit error:', err);
      toast({
        title: 'Could not send request',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {

    if (isLoading) return;
    if (!search && category === 'all' && !locationSelection && !typedLocation && !verifiedOnly && !superVendorsOnly) {
      return;
    }
    const timeout = setTimeout(() => {
      trackEvent({
        event_type: vendors.length === 0 ? 'search_zero_results' : 'search_performed',
        actor_type: 'organiser',
        actor_id: user?.id,
        metadata: {
          query: search || null,
          category: category !== 'all' ? category : null,
          location: locationSelection?.label || typedLocation || null,
          verified_only: verifiedOnly,
          super_vendors_only: superVendorsOnly,
          results_count: vendors.length,
        },
      });
    }, 1500);
    return () => clearTimeout(timeout);
  }, [search, category, locationSelection?.label, typedLocation, verifiedOnly, superVendorsOnly, vendors.length, isLoading, user?.id]);

  return (
    <div className="min-h-screen pb-safe">
      <PageHeader title="Vendors" subtitle="Find trusted vendors" />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-card-border"
          />
        </div>

        {/* Event selector for distance */}
        {events.length > 0 && (
          <Select value={selectedEventId || "none"} onValueChange={(v) => setSelectedEventId(v === "none" ? "" : v)}>
            <SelectTrigger className="border-card-border">
              <SelectValue placeholder="Compare distances for ceremony..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No ceremony selected</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Filters */}
        <div className="flex gap-3">
          <Select value={category} onValueChange={(v) => setCategory(v as VendorCategory | 'all')}>
            <SelectTrigger className="flex-1 border-card-border">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {LIVE_VENDOR_CATEGORY_FILTER_OPTIONS.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1">
            <LocationCombobox
              value={locationSelection}
              onChange={(next) => {
                setLocationSelection(next);
                if (next) setTypedLocation('');
              }}
              onNoMatch={(typed) => setTypedLocation(typed)}
            />
          </div>
        </div>

        {/* Badge Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="verified" checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
            <Label htmlFor="verified" className="text-xs flex items-center gap-1 cursor-pointer">
              <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />
              Verified only
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="super" checked={superVendorsOnly} onCheckedChange={setSuperVendorsOnly} />
            <Label htmlFor="super" className="text-xs flex items-center gap-1 cursor-pointer">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              Super Vendors
            </Label>
          </div>
        </div>

        {/* Sort control */}
        {selectedEventId && (
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-full border-card-border">
              <ArrowUpDown className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Sort by Rating</SelectItem>
              <SelectItem value="distance">Sort by Distance</SelectItem>
              <SelectItem value="name">Sort by Name</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Results */}
        <div className="space-y-3 pt-2">
          {locationSelection && (
            <p className="text-xs text-muted-foreground">
              Showing vendors serving {locationSelection.label}
            </p>
          )}
          {selectedEventId && !hasEventCoordinates && (
            <p className="text-sm text-muted-foreground">
              <span className="block text-xs mt-1">
                Set ceremony location to see distances
              </span>
            </p>
          )}

          {vendors.slice(0, page * PAGE_SIZE).map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              showDistance={!!selectedEventId && hasEventCoordinates}
            />
          ))}

          {vendors.length > page * PAGE_SIZE && (
            <button
              onClick={() => setPage(p => p + 1)}
              className="w-full py-3 text-sm font-medium text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors"
            >
              Show more vendors
            </button>
          )}

          {!isLoading && vendors.length === 0 && (
            <div className="py-8 px-4 rounded-2xl border border-card-border bg-card/50 space-y-4">
              <h3 className="text-base font-semibold text-center text-foreground">No vendors found</h3>
              <p className="text-sm font-medium text-foreground text-center leading-relaxed">
                Couldn't find what you were looking for. Tell us what you need and where you need it and we will find it for you
              </p>
              <div className="space-y-3">
                <Input
                  placeholder="What do you need?"
                  value={needInput}
                  onChange={(e) => setNeedInput(e.target.value)}
                  className="border-card-border"
                />
                <Input
                  placeholder="Where do you need it?"
                  value={whereInput}
                  onChange={(e) => setWhereInput(e.target.value)}
                  className="border-card-border"
                />
                <Button
                  onClick={handleUnmetDemandSubmit}
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Send
                </Button>
                {validationError && (
                  <p className="text-xs text-destructive text-center">{validationError}</p>
                )}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSearch('');
                  setCategory('all');
                  setLocationSelection(null);
                  setTypedLocation('');
                  setVerifiedOnly(false);
                  setSuperVendorsOnly(false);
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
