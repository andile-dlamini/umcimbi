import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ServiceRegion {
  id: string;
  name: string;
}

interface ServiceArea {
  id: string;
  region_id: string;
  name: string;
}

interface VendorServiceRegionsProps {
  vendorId: string | null;
  value: string[];
  onChange: (regionIds: string[]) => void;
  disabled?: boolean;
}

export function VendorServiceRegions({ value, onChange, disabled }: VendorServiceRegionsProps) {
  const [regions, setRegions] = useState<ServiceRegion[]>([]);
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: regionRows }, { data: areaRows }] = await Promise.all([
        supabase.from('service_regions').select('id, name').order('display_order'),
        supabase.from('service_areas').select('id, region_id, name').order('display_order'),
      ]);
      setRegions(regionRows ?? []);
      setAreas(areaRows ?? []);
      setIsLoading(false);
    };
    load();
  }, []);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading regions...</p>;
  }

  const allSelected = regions.length > 0 && regions.every((r) => value.includes(r.id));

  const toggleAll = (checked: boolean) => {
    onChange(checked ? regions.map((r) => r.id) : []);
  };

  const toggleRegion = (regionId: string, checked: boolean) => {
    onChange(checked ? [...value, regionId] : value.filter((id) => id !== regionId));
  };

  const areaSummary = (regionId: string) => {
    const names = areas.filter((a) => a.region_id === regionId).map((a) => a.name);
    if (names.length === 0) return null;
    const shown = names.slice(0, 6).join(', ');
    return names.length > 6 ? `${shown}…` : shown;
  };

  return (
    <div className="space-y-2">
      <Label>Service areas</Label>
      <p className="text-xs text-muted-foreground">
        Select the regions you serve. You will appear in searches for any area in the regions you choose.
      </p>
      <label className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer w-full">
        <Checkbox
          checked={allSelected}
          disabled={disabled}
          onCheckedChange={(checked) => toggleAll(checked === true)}
        />
        <span className="text-sm font-medium">I serve all of KwaZulu-Natal</span>
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {regions.map((region) => (
          <label
            key={region.id}
            className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
          >
            <Checkbox
              checked={value.includes(region.id)}
              disabled={disabled}
              onCheckedChange={(checked) => toggleRegion(region.id, checked === true)}
            />
            <span className="text-sm">
              {region.name}
              {areaSummary(region.id) && (
                <span className="block text-xs text-muted-foreground">{areaSummary(region.id)}</span>
              )}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
