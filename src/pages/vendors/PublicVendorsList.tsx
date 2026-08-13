import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VendorCard } from '@/components/shared/VendorCard';
import { LIVE_VENDOR_CATEGORY_FILTER_OPTIONS, LIVE_VENDOR_CATEGORY_VALUES, VendorCategory } from '@/lib/vendorCategories';
import { supabase } from '@/integrations/supabase/client';
import type { Vendor } from '@/types/database';

export default function PublicVendorsList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') ?? '');

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      let query = (supabase as any)
        .from('vendors_directory_public')
        .select('*')
        .order('is_super_vendor', { ascending: false, nullsFirst: false })
        .order('review_count', { ascending: false, nullsFirst: false });

      if (locationFilter.trim()) {
        query = query.ilike('location', `%${locationFilter.trim()}%`);
      }

      const { data, error } = await query;
      if (!error && data) setVendors(data as unknown as Vendor[]);
      setIsLoading(false);
    })();
  }, [locationFilter]);

  const filtered = vendors.filter((v) => {
    const matchesSearch = !search || v.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || v.category === category;
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

            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="pl-10 border-card-border"
              />
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
