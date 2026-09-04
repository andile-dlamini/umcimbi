import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Vendor, Event } from '@/types/database';
import { getDistanceInKm } from '@/lib/distanceUtils';
import { VendorCategory, HIDDEN_VENDOR_CATEGORIES } from '@/lib/vendorCategories';
import { fetchVendorRegionMap, applyRegionFilterAndSort } from '@/hooks/useVendors';

function sanitizeVendorSearchTerm(term: string): string {
  return term
    .replace(/[,"()\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildVendorSearchFilter(searchTerm: string): string | null {
  const sanitized = sanitizeVendorSearchTerm(searchTerm);
  const words = sanitized.split(/\s+/).filter(Boolean).slice(0, 5);
  if (words.length === 0) return null;
  return words
    .map((word) => `name.ilike.%${word}%,about.ilike.%${word}%`)
    .join(',');
}

export interface VendorWithDistance extends Vendor {
  distanceKm: number | null;
}

export type SortOption = 'distance' | 'rating' | 'name';

export function useVendorsWithDistance(
  eventId?: string,
  filters?: {
    category?: VendorCategory | 'all';
    regionId?: string | null;
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
        // Curated view: same rows, minus banking/registration/admin-note columns.
        .from('vendors_marketplace')
        .select('*')
        .eq('is_active', true)
        .eq('state_province', 'KwaZulu-Natal')
        .not('category', 'in', `(${HIDDEN_VENDOR_CATEGORIES.join(',')})`);

      if (filters?.category && filters.category !== 'all') {
        query = query.or(`category.eq.${filters.category},additional_categories.cs.{${filters.category}}`);
      }

      if (filters?.search) {
        const orFilter = buildVendorSearchFilter(filters.search);
        if (orFilter) {
          query = query.or(orFilter);
        }
      }

      if (filters?.verifiedOnly) {
        query = query.eq('business_verification_status', 'verified');
      }

      if (filters?.superVendorsOnly) {
        query = query.eq('is_super_vendor', true);
      }

      const [{ data: vendorsData }, regionMap] = await Promise.all([query, fetchVendorRegionMap()]);
      const rows = (vendorsData || []) as unknown as Vendor[];
      setVendors(applyRegionFilterAndSort(rows, regionMap, filters?.regionId));
      setIsLoading(false);
    };

    fetchData();
  }, [eventId, filters?.category, filters?.regionId, filters?.search, filters?.verifiedOnly, filters?.superVendorsOnly]);

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

    // Sort with badge boost: verified vendors first, then by selected sort
    return withDistance.sort((a, b) => {
      // Badge boost
      const aBoost = ((a as any).business_verification_status === 'verified' ? 1 : 0);
      const bBoost = ((b as any).business_verification_status === 'verified' ? 1 : 0);
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
        default: {
          const aCount = a.review_count ?? 0;
          const bCount = b.review_count ?? 0;
          if (aCount !== bCount) return bCount - aCount;
          return (b.rating ?? 0) - (a.rating ?? 0);
        }
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
