import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Vendor, Event } from '@/types/database';
import { getDistanceInKm } from '@/lib/distanceUtils';
import { VendorCategory } from '@/lib/vendorCategories';

export interface VendorWithDistance extends Vendor {
  distanceKm: number | null;
}

export type SortOption = 'distance' | 'rating' | 'name';

export function useVendorsWithDistance(
  eventId?: string,
  filters?: {
    category?: VendorCategory | 'all';
    location?: string;
    search?: string;
    verifiedOnly?: boolean;
    superVendorsOnly?: boolean;
  }
) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('rating');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Fetch event if eventId is provided
      if (eventId) {
        const { data: eventData } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .maybeSingle();
        
        setEvent(eventData as Event | null);
      }

      // Fetch vendors
      let query = supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true);

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters?.location && filters.location !== 'All Locations') {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,about.ilike.%${filters.search}%`);
      }

      if (filters?.verifiedOnly) {
        query = query.eq('business_verification_status', 'verified');
      }

      if (filters?.superVendorsOnly) {
        query = query.eq('is_super_vendor', true);
      }

      const { data: vendorsData } = await query;
      setVendors((vendorsData || []) as Vendor[]);
      setIsLoading(false);
    };

    fetchData();
  }, [eventId, filters?.category, filters?.location, filters?.search, filters?.verifiedOnly, filters?.superVendorsOnly]);

  // Compute distances and sort
  const vendorsWithDistance: VendorWithDistance[] = useMemo(() => {
    const eventLat = event?.latitude;
    const eventLng = event?.longitude;

    const withDistance = vendors.map(vendor => ({
      ...vendor,
      distanceKm: getDistanceInKm(
        eventLat,
        eventLng,
        vendor.latitude,
        vendor.longitude
      ),
    }));

    // Sort with badge boost: super vendors first, then verified, then by selected sort
    return withDistance.sort((a, b) => {
      // Badge boost
      const aBoost = ((a as any).is_super_vendor ? 2 : 0) + ((a as any).business_verification_status === 'verified' ? 1 : 0);
      const bBoost = ((b as any).is_super_vendor ? 2 : 0) + ((b as any).business_verification_status === 'verified' ? 1 : 0);
      if (aBoost !== bBoost) return bBoost - aBoost;

      switch (sortBy) {
        case 'distance':
          if (a.distanceKm === null && b.distanceKm === null) return 0;
          if (a.distanceKm === null) return 1;
          if (b.distanceKm === null) return -1;
          return a.distanceKm - b.distanceKm;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
        default:
          return (b.rating || 0) - (a.rating || 0);
      }
    });
  }, [vendors, event, sortBy]);

  return {
    vendors: vendorsWithDistance,
    event,
    isLoading,
    sortBy,
    setSortBy,
    hasEventCoordinates: event?.latitude != null && event?.longitude != null,
  };
}
