import { useState } from 'react';
import { Search, MapPin, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/PageHeader';
import { VendorCard } from '@/components/shared/VendorCard';
import { useVendorsWithDistance, SortOption } from '@/hooks/useVendorsWithDistance';
import { useEvents } from '@/hooks/useEvents';
import { VENDOR_CATEGORY_FILTER_OPTIONS, VendorCategory } from '@/lib/vendorCategories';

export default function VendorsList() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<VendorCategory | 'all'>('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  
  const { events } = useEvents();
  const { vendors, isLoading, sortBy, setSortBy, hasEventCoordinates } = useVendorsWithDistance(
    selectedEventId || undefined,
    { 
      category, 
      location: locationFilter || 'All Locations', 
      search 
    }
  );

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

        {/* Event selector for distance */}
        {events.length > 0 && (
          <Select value={selectedEventId || "none"} onValueChange={(v) => setSelectedEventId(v === "none" ? "" : v)}>
            <SelectTrigger>
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

        {/* Sort control */}
        {selectedEventId && (
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-full">
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
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading...' : `${vendors.length} vendor${vendors.length !== 1 ? 's' : ''} found`}
            {selectedEventId && !hasEventCoordinates && (
              <span className="block text-xs mt-1">
                Set ceremony location to see distances
              </span>
            )}
          </p>

          {vendors.map((vendor) => (
            <VendorCard 
              key={vendor.id} 
              vendor={vendor} 
              showDistance={!!selectedEventId && hasEventCoordinates}
            />
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
