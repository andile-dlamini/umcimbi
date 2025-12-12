import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/PageHeader';
import { VendorCard } from '@/components/shared/VendorCard';
import { useVendors } from '@/hooks/useVendors';
import { VENDOR_CATEGORY_FILTER_OPTIONS, VendorCategory } from '@/lib/vendorCategories';

export default function VendorsList() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<VendorCategory | 'all'>('all');
  const [locationFilter, setLocationFilter] = useState('');
  
  const { vendors, isLoading } = useVendors({ 
    category, 
    location: locationFilter || 'All Locations', 
    search 
  });

  return (
    <div className="min-h-screen pb-safe">
      <PageHeader title="Vendors" subtitle="Find trusted service providers" />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <Select value={category} onValueChange={(v) => setCategory(v as VendorCategory | 'all')}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {VENDOR_CATEGORY_FILTER_OPTIONS.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
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
              className="pl-10"
            />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-3 pt-2">
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading...' : `${vendors.length} vendor${vendors.length !== 1 ? 's' : ''} found`}
          </p>

          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}

          {!isLoading && vendors.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No vendors found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your filters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
