import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Vendor, CreateVendor } from '@/types/database';
import { VendorCategory } from '@/lib/vendorCategories';
import { geocodeAddress } from '@/lib/geocodingService';
import { toast } from 'sonner';

export function useVendors(filters?: {
  category?: VendorCategory | 'all';
  location?: string;
  search?: string;
}) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVendors = useCallback(async () => {
    let query = supabase
      .from('vendors')
      .select('*')
      .eq('is_active', true)
      .order('rating', { ascending: false });

    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters?.location && filters.location !== 'All Locations') {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,about.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to load vendors');
    } else {
      setVendors((data || []) as Vendor[]);
    }
    setIsLoading(false);
  }, [filters?.category, filters?.location, filters?.search]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  return {
    vendors,
    isLoading,
    refreshVendors: fetchVendors,
  };
}

export function useVendor(vendorId: string | undefined) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVendor = async () => {
      if (!vendorId) {
        setVendor(null);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching vendor:', error);
      } else {
        setVendor(data as Vendor | null);
        
        // Increment view count (fire and forget)
        if (data) {
          supabase.from('vendors').update({ view_count: (data.view_count || 0) + 1 }).eq('id', vendorId);
        }
      }
      setIsLoading(false);
    };

    fetchVendor();
  }, [vendorId]);

  return { vendor, isLoading };
}

export function useMyVendorProfile() {
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVendor = useCallback(async () => {
    if (!user) {
      setVendor(null);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('owner_user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching vendor profile:', error);
    } else {
      setVendor(data && data.length > 0 ? (data[0] as Vendor) : null);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  const createVendorProfile = async (vendorData: Omit<CreateVendor, 'owner_user_id' | 'is_active'>) => {
    if (!user) {
      toast.error('Please sign in first');
      return null;
    }

    // Geocode the location if provided
    let coordinates: { latitude: number; longitude: number } | null = null;
    if (vendorData.location) {
      coordinates = await geocodeAddress(vendorData.location);
    }

    const { data, error } = await supabase
      .from('vendors')
      .insert({
        ...vendorData,
        owner_user_id: user.id,
        is_active: true,
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating vendor:', error);
      toast.error('Failed to create vendor profile');
      return null;
    }

    // Add vendor role (ignore if already exists)
    await supabase.from('user_roles').upsert({
      user_id: user.id,
      role: 'vendor',
    }, { onConflict: 'user_id,role' });

    setVendor(data as Vendor);
    toast.success('Vendor profile created!');
    return data as Vendor;
  };

  const updateVendorProfile = async (updates: Partial<Vendor>) => {
    if (!user || !vendor) {
      toast.error('No vendor profile found');
      return false;
    }

    // If location is being updated, geocode it
    let finalUpdates = { ...updates };
    if (updates.location !== undefined) {
      const coordinates = updates.location ? await geocodeAddress(updates.location) : null;
      finalUpdates = {
        ...finalUpdates,
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null,
      };
    }

    const { error } = await supabase
      .from('vendors')
      .update(finalUpdates)
      .eq('id', vendor.id);

    if (error) {
      console.error('Error updating vendor:', error);
      toast.error('Failed to update vendor profile');
      return false;
    }

    setVendor(prev => prev ? { ...prev, ...finalUpdates } : null);
    toast.success('Vendor profile updated');
    return true;
  };

  const deleteVendorProfile = async () => {
    if (!user || !vendor) {
      toast.error('No vendor profile found');
      return false;
    }

    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', vendor.id);

    if (error) {
      console.error('Error deleting vendor:', error);
      toast.error('Failed to delete vendor profile');
      return false;
    }

    setVendor(null);
    toast.success('Vendor profile deleted');
    return true;
  };

  return {
    vendor,
    isLoading,
    createVendorProfile,
    updateVendorProfile,
    deleteVendorProfile,
    refreshVendor: fetchVendor,
  };
}

// Get unique locations from vendors
export function useVendorLocations() {
  const [locations, setLocations] = useState<string[]>(['All Locations']);

  useEffect(() => {
    const fetchLocations = async () => {
      const { data } = await supabase
        .from('vendors')
        .select('location')
        .eq('is_active', true)
        .not('location', 'is', null);

      if (data) {
        const uniqueLocations = [...new Set(data.map(v => v.location).filter(Boolean))] as string[];
        setLocations(['All Locations', ...uniqueLocations.sort()]);
      }
    };

    fetchLocations();
  }, []);

  return locations;
}
