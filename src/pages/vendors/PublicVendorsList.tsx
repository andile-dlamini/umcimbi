import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VendorCard } from '@/components/shared/VendorCard';
import { LIVE_VENDOR_CATEGORY_FILTER_OPTIONS, LIVE_VENDOR_CATEGORY_VALUES, VendorCategory, vendorHasCategory } from '@/lib/vendorCategories';
import { supabase } from '@/integrations/supabase/client';
import type { Vendor } from '@/types/database';
import { LocationCombobox, LocationSelection } from '@/components/vendors/LocationCombobox';
import { fetchVendorRegionMap, applyRegionFilterAndSort } from '@/hooks/useVendors';

export default function PublicVendorsList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCategory = (() => {
    const raw = searchParams.get('category');
    return raw && (LIVE_VENDOR_CATEGORY_VALUES as string[]).includes(raw)
      ? (raw as VendorCategory)
      : ('all' as const);
  })();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<VendorCategory | 'all'>(initialCategory);
  const [locationSelection, setLocationSelection] = useState<LocationSelection | null>(null);

  // Resolve the ?location= label (region or area name) into a region selection on first load.
  useEffect(() => {
    const label = searchParams.get('location');
    if (!label) return;
    (async () => {
      const [{ data: region }, { data: area }] = await Promise.all([
        supabase.from('service_regions').select('id, name').ilike('name', label).maybeSingle(),
        supabase.from('service_areas').select('region_id, name').ilike('name', label).maybeSingle(),
      ]);
      if (region) setLocationSelection({ regionId: region.id, label: region.name });
      else if (area) setLocationSelection({ regionId: area.region_id, label: area.name });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocationChange = (next: LocationSelection | null) => {
    setLocationSelection(next);
    const params = new URLSearchParams(searchParams);
    if (next) params.set('location', next.label);
    else params.delete('location');
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      let query = (supabase as any)
        .from('vendors_directory_public')
        .select('*')
        .order('is_super_vendor', { ascending: false, nullsFirst: false })
        .order('review_count', { ascending: false, nullsFirst: false });

      const [{ data, error }, regionMap] = await Promise.all([query, fetchVendorRegionMap()]);
      if (!error && data) {
        const rows = data as unknown as Vendor[];
        setVendors(applyRegionFilterAndSort(rows, regionMap, locationSelection?.regionId ?? null));
      }
      setIsLoading(false);
    })();
  }, [locationSelection?.regionId]);

  const filtered = vendors.filter((v) => {
    const matchesSearch = !search || v.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || vendorHasCategory(v, category);
    return matchesSearch && matchesCategory;
  });

  const handleCardClick = (vendorId: string) => {
    navigate(`/auth?mode=signup&role=planner&redirect=${encodeURIComponent(`/vendors/${vendorId}`)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/onboarding" className="font-heading text-lg font-bold text-foreground">
            UMCIMBI
          </Link>
          <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
            Sign in
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-foreground">Find trusted vendors</h1>
          <p className="text-muted-foreground mt-1">
            Browse verified vendors for your traditional ceremony. Sign in to request a quote.
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors by name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={category} onValueChange={(v) => setCategory(v as VendorCategory | 'all')}>
              <SelectTrigger className="sm:w-56">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {LIVE_VENDOR_CATEGORY_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1">
              <LocationCombobox value={locationSelection} onChange={handleLocationChange} />
            </div>
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-center py-12">Loading vendors...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            No vendors found. Try a different search or category.
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} onCardClick={() => handleCardClick(vendor.id)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
