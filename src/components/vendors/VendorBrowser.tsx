import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
'@/components/ui/select';
import {
  Search,
  Shirt,
  UtensilsCrossed,
  Snowflake,
  Sparkles,
  Music2,
  CalendarCheck,
  Droplets,
  Camera,
  Tent,
  MoreHorizontal,
  X,
  Loader2 } from
'lucide-react';
import VendorTile, { VendorTileData } from '@/components/vendors/VendorTile';
import { supabase } from '@/integrations/supabase/client';
import {
  LIVE_VENDOR_CATEGORIES,
  LIVE_VENDOR_CATEGORY_FILTER_OPTIONS,
  VendorCategory } from
'@/lib/vendorCategories';

const CATEGORY_ICONS: Partial<Record<VendorCategory, typeof Camera>> = {
  attire_tailoring: Shirt,
  catering: UtensilsCrossed,
  cold_room_hire: Snowflake,
  decor: Sparkles,
  dj_sound_audio: Music2,
  event_planning: CalendarCheck,
  mobile_toilets: Droplets,
  photographer: Camera,
  tents: Tent
};

interface VendorBrowserProps {
  /** Render the white search card (category select + location input + Search). */
  showSearchCard: boolean;
  /** How many vendor tiles to display. */
  resultCount: number;
  onVendorClick: (vendorId: string) => void;
  /** Mirror the active filter into the page URL (and read it back on mount). */
  syncUrl?: boolean;
}

export default function VendorBrowser({
  showSearchCard,
  resultCount,
  onVendorClick,
  syncUrl = false
}: VendorBrowserProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // When syncUrl is off the component never reads or writes the URL.
  const initialCategory = (syncUrl ? (searchParams.get('category') as VendorCategory) : null) || '';
  const initialLocation = (syncUrl ? searchParams.get('location') : null) || '';

  const [searchCategory, setSearchCategory] = useState<VendorCategory | 'all' | ''>(initialCategory);
  const [searchLocation, setSearchLocation] = useState(initialLocation);
  const [activeCategory, setActiveCategory] = useState<VendorCategory | 'all' | ''>(initialCategory);
  const [activeLocation, setActiveLocation] = useState(initialLocation);
  const [results, setResults] = useState<VendorTileData[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setResultsLoading(true);
      let query = (supabase as any).
      from('vendors_directory_public').
      select('id,name,category,location,logo_url,image_urls,about');

      if (activeCategory && activeCategory !== 'all') query = query.eq('category', activeCategory);
      if (activeLocation.trim()) query = query.ilike('location', `%${activeLocation.trim()}%`);

      // Explicit 60-row slice, shuffled client side (PostgREST cannot order randomly).
      // NOTE: once the active vendor count approaches 60 this needs revisiting — beyond
      // that point the shuffle would only ever reorder the same fixed subset.
      const { data, error } = await query.limit(60);
      if (cancelled) return;

      if (error || !data) {
        setResults([]);
      } else {
        // Shuffle once, when the result arrives, and store it in state — never in render.
        const shuffled = [...(data as VendorTileData[])];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setResults(shuffled.slice(0, resultCount));
      }
      setResultsLoading(false);
    })();
    return () => {cancelled = true;};
  }, [activeCategory, activeLocation, resultCount]);

  const syncUrlParams = (category: string, location: string) => {
    if (!syncUrl) return;
    const params = new URLSearchParams();
    if (category && category !== 'all') params.set('category', category);
    if (location.trim()) params.set('location', location.trim());
    setSearchParams(params, { replace: true });
  };

  const scrollToResults = () => {
    document.getElementById('vendor-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const applyFilter = (category: VendorCategory | 'all' | '', location: string) => {
    setActiveCategory(category);
    setActiveLocation(location);
    setSearchCategory(category);
    setSearchLocation(location);
    syncUrlParams(category, location);
  };

  const clearFilter = () => {
    applyFilter('', '');
  };

  const handleCategoryClick = (category: VendorCategory) => {
    applyFilter(category, activeLocation);
    setTimeout(scrollToResults, 50);
  };

  const handleVendorSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilter(searchCategory, searchLocation);
    setTimeout(scrollToResults, 50);
  };

  const activeCategoryLabel =
  activeCategory && activeCategory !== 'all' ?
  LIVE_VENDOR_CATEGORIES.find((c) => c.value === activeCategory)?.label ?? activeCategory :
  '';
  const hasActiveFilter = Boolean(activeCategoryLabel || activeLocation.trim());

  return (
    <>
      {showSearchCard &&
      <form
        onSubmit={handleVendorSearch}
        className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto">
          <Select value={searchCategory || undefined} onValueChange={(v) => setSearchCategory(v as VendorCategory | 'all')}>
            <SelectTrigger className="sm:flex-1">
              <SelectValue placeholder="Categories" />
            </SelectTrigger>
            <SelectContent>
              {LIVE_VENDOR_CATEGORY_FILTER_OPTIONS.map((opt) =>
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            )}
            </SelectContent>
          </Select>

          <Input
          value={searchLocation}
          onChange={(e) => setSearchLocation(e.target.value)}
          placeholder="Durban"
          className="sm:flex-1" />

          <Button type="submit" className="rounded-full px-8 font-semibold">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>
      }

      <div id="vendor-results" className={`${showSearchCard ? 'mt-12' : ''} scroll-mt-28`}>
        {hasActiveFilter &&
        <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-sm text-white/80">
              Showing{activeCategoryLabel ? ` ${activeCategoryLabel}` : ' all vendors'}
              {activeLocation.trim() ? ` in ${activeLocation.trim()}` : ''}
            </span>
            <button
          onClick={clearFilter}
          className="inline-flex items-center gap-1 text-sm font-semibold text-white bg-white/15 hover:bg-white/25 rounded-full px-3 py-1 transition-colors">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          </div>
        }

        {resultsLoading ?
        <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-white/70" />
          </div> :
        results.length === 0 ?
        <div className="text-center py-10">
            <p className="text-white/80">No vendors match that search yet.</p>
            <Button onClick={clearFilter} variant="outline" size="sm" className="mt-4 rounded-full border-white/30 !text-white bg-white/5 hover:bg-white/15">
              Clear filter
            </Button>
          </div> :

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {results.map((v) =>
          <VendorTile key={v.id} vendor={v} showAbout onClick={() => onVendorClick(v.id)} />
          )}
          </div>
        }
      </div>

      <div className="mt-14">
        <h3 className="text-center text-xl sm:text-2xl font-bold text-white mb-8">Explore vendors by category</h3>
        <div className="grid grid-cols-3 lg:grid-cols-9 gap-5">
          {LIVE_VENDOR_CATEGORIES.filter((c) => c.value !== 'other').map((cat) => {
            const Icon = CATEGORY_ICONS[cat.value] ?? MoreHorizontal;
            return (
              <button
                key={cat.value}
                onClick={() => handleCategoryClick(cat.value)}
                className="group flex flex-col items-center gap-2 text-center">
                <span className="w-16 h-16 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/25 transition-colors">
                  <Icon className="h-7 w-7 text-secondary" />
                </span>
                <span className="text-[12px] leading-tight text-white/85">{cat.label}</span>
              </button>);

          })}
        </div>
      </div>
    </>);

}
