import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/layout/PageHeader';
import { toast } from 'sonner';

interface VendorRow {
  id: string;
  name: string;
  is_super_vendor: boolean;
  rating: number;
  review_count: number;
}

export default function SuperVendorManagement() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('vendors')
        .select('id, name, is_super_vendor, rating, review_count')
        .eq('is_active', true)
        .order('name');
      setVendors((data || []) as VendorRow[]);
      setIsLoading(false);
    };
    fetch();
  }, []);

  const handleToggle = async (vendorId: string, newValue: boolean) => {
    const reason = reasons[vendorId]?.trim();
    if (!reason) {
      toast.error('Please provide a reason');
      return;
    }

    const { error } = await supabase
      .from('vendors')
      .update({
        is_super_vendor: newValue,
        super_vendor_awarded_at: newValue ? new Date().toISOString() : null,
        super_vendor_reason: reason,
      } as any)
      .eq('id', vendorId);

    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success(newValue ? 'Super Vendor granted' : 'Super Vendor removed');
      setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, is_super_vendor: newValue } : v));
      setReasons(prev => ({ ...prev, [vendorId]: '' }));
    }
  };

  return (
    <div className="min-h-screen pb-safe bg-background">
      <PageHeader title="Super Vendor Management" showBack />
      <div className="px-4 py-6 max-w-lg mx-auto space-y-3">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : vendors.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No vendors found</p>
        ) : (
          vendors.map((vendor) => (
            <Card key={vendor.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm flex items-center gap-1">
                      {vendor.name}
                      {vendor.is_super_vendor && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ⭐ {vendor.rating} ({vendor.review_count} reviews)
                    </p>
                  </div>
                  <Switch
                    checked={vendor.is_super_vendor}
                    onCheckedChange={(val) => handleToggle(vendor.id, val)}
                  />
                </div>
                <Input
                  placeholder="Reason (required)..."
                  value={reasons[vendor.id] || ''}
                  onChange={(e) => setReasons(prev => ({ ...prev, [vendor.id]: e.target.value }))}
                  className="text-sm h-8"
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
