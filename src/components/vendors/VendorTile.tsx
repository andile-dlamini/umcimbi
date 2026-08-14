import { useState } from 'react';
import { getVendorCategoryLabel, truncateVendorCategories } from '@/lib/vendorCategories';

export interface VendorTileData {
  id: string;
  name: string;
  category: string;
  location: string | null;
  logo_url: string | null;
  image_urls: string[] | null;
  about?: string | null;
}

interface VendorTileProps {
  vendor: VendorTileData;
  onClick?: () => void;
  /** Render the vendor's about text (clamped to two lines) below the meta line */
  showAbout?: boolean;
  className?: string;
}

export default function VendorTile({ vendor, onClick, showAbout, className }: VendorTileProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = vendor.logo_url || vendor.image_urls?.[0];
  const about = vendor.about?.trim();
  const showImage = image && !imageFailed;

  return (
    <button
      onClick={onClick}
      className={`group text-left rounded-2xl border border-border bg-card overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all ${className ?? ''}`}>
      <div className="h-40 w-full bg-muted overflow-hidden">
        {showImage ?
          <img
            src={image}
            alt={vendor.name}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={() => setImageFailed(true)}
          /> :
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-2xl font-bold text-muted-foreground">
              {vendor.name.charAt(0).toUpperCase()}
            </span>
          </div>
        }
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate">{vendor.name}</h3>
        <p className="text-sm text-muted-foreground mt-1 truncate">
          {(() => {
            const { text, more } = truncateVendorCategories(vendor, 2);
            return (
              <>
                {text}
                {more > 0 && <span className="text-muted-foreground/70">{` +${more} more`}</span>}
                {vendor.location ? ` · ${vendor.location}` : ''}
              </>
            );
          })()}
        </p>
        {showAbout && about &&
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{about}</p>
        }
      </div>
    </button>
  );
}
