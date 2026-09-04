import { useEffect, useMemo, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface Region {
  id: string;
  name: string;
  display_order: number;
}

interface Area {
  id: string;
  region_id: string;
  name: string;
  aliases: string[] | null;
}

export interface LocationSelection {
  regionId: string;
  label: string;
}

interface LocationComboboxProps {
  value: LocationSelection | null;
  onChange: (next: LocationSelection | null) => void;
  onNoMatch?: (typedText: string) => void;
  placeholder?: string;
}

const MAX_RESULTS = 8;

export function LocationCombobox({
  value,
  onChange,
  onNoMatch,
  placeholder = 'Where is your ceremony?',
}: LocationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [regions, setRegions] = useState<Region[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  useEffect(() => {
    const load = async () => {
      const [{ data: regionRows }, { data: areaRows }] = await Promise.all([
        supabase.from('service_regions').select('id, name, display_order').order('display_order'),
        supabase.from('service_areas').select('id, region_id, name, aliases').order('display_order'),
      ]);
      setRegions((regionRows ?? []) as Region[]);
      setAreas((areaRows ?? []) as Area[]);
    };
    load();
  }, []);

  const regionNameById = useMemo(() => {
    const map = new Map<string, string>();
    regions.forEach((r) => map.set(r.id, r.name));
    return map;
  }, [regions]);

  const trimmedQuery = query.trim();
  const lowerQuery = trimmedQuery.toLowerCase();

  const matchingRegions = useMemo(() => {
    if (!lowerQuery) return regions;
    return regions.filter((r) => r.name.toLowerCase().includes(lowerQuery));
  }, [regions, lowerQuery]);

  const matchingAreas = useMemo(() => {
    if (!lowerQuery) return [];
    return areas.filter(
      (a) =>
        a.name.toLowerCase().includes(lowerQuery) ||
        (a.aliases ?? []).some((alias) => alias.toLowerCase().includes(lowerQuery))
    );
  }, [areas, lowerQuery]);

  const shownRegions = matchingRegions.slice(0, MAX_RESULTS);
  const shownAreas = matchingAreas.slice(0, Math.max(0, MAX_RESULTS - shownRegions.length));

  const hasNoMatch = lowerQuery.length >= 3 && matchingRegions.length === 0 && matchingAreas.length === 0;

  useEffect(() => {
    if (hasNoMatch && onNoMatch) onNoMatch(trimmedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasNoMatch, trimmedQuery]);

  const select = (next: LocationSelection | null) => {
    onChange(next);
    setOpen(false);
    setQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-start border-card-border font-normal"
        >
          <MapPin className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
          <span className={value ? 'truncate' : 'truncate text-muted-foreground'}>
            {value ? value.label : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width] min-w-[240px]" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search area or region..." value={query} onValueChange={setQuery} />
          <CommandList className="max-h-64 overflow-y-auto">
            {hasNoMatch && <CommandEmpty>No matching area</CommandEmpty>}

            {value && (
              <CommandGroup>
                <CommandItem value="__clear__" onSelect={() => select(null)}>
                  <X className="h-4 w-4 mr-2 text-muted-foreground" />
                  Clear
                </CommandItem>
              </CommandGroup>
            )}

            {shownRegions.length > 0 && (
              <CommandGroup heading="Regions">
                {shownRegions.map((region) => (
                  <CommandItem
                    key={region.id}
                    value={`region-${region.id}`}
                    onSelect={() => select({ regionId: region.id, label: region.name })}
                  >
                    {region.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {shownAreas.length > 0 && (
              <CommandGroup heading="Areas">
                {shownAreas.map((area) => (
                  <CommandItem
                    key={area.id}
                    value={`area-${area.id}`}
                    onSelect={() => select({ regionId: area.region_id, label: area.name })}
                  >
                    <span>
                      {area.name}
                      <span className="block text-xs text-muted-foreground">
                        {regionNameById.get(area.region_id) ?? ''}
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
