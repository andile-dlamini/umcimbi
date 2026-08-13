import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import VendorTile, { VendorTileData } from '@/components/vendors/VendorTile';

interface VendorCarouselProps {
  vendors: VendorTileData[];
  onVendorClick?: (vendor: VendorTileData) => void;
  showAbout?: boolean;
}

export default function VendorCarousel({ vendors, onVendorClick, showAbout }: VendorCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows, vendors.length]);

  const scrollByTile = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const tile = el.querySelector<HTMLElement>('[data-tile]');
    const amount = (tile?.offsetWidth ?? 240) + 20;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: direction * amount, behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex gap-5 overflow-x-auto pb-4 -mx-5 px-5 sm:mx-0 sm:px-0 md:px-14 scroll-smooth">
        {vendors.map((v) =>
        <VendorTile
          key={v.id}
          vendor={v}
          showAbout={showAbout}
          onClick={() => onVendorClick?.(v)}
          className="shrink-0 w-60" />
        )}
        {/* marker for tile width measurement */}
        <span data-tile className="hidden" />
      </div>

      {canLeft &&
      <button
        type="button"
        aria-label="Previous vendors"
        onClick={() => scrollByTile(-1)}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full border border-border bg-background/95 shadow-md hover:bg-muted transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
      }
      {canRight &&
      <button
        type="button"
        aria-label="Next vendors"
        onClick={() => scrollByTile(1)}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full border border-border bg-background/95 shadow-md hover:bg-muted transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
      }
    </div>
  );
}
