import { BadgeCheck, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VendorBadgesProps {
  businessVerificationStatus?: string | null;
  isSuperVendor?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function VendorBadges({ 
  businessVerificationStatus, 
  isSuperVendor, 
  className,
  size = 'sm' 
}: VendorBadgesProps) {
  const isVerified = businessVerificationStatus === 'verified';
  
  if (!isVerified && !isSuperVendor) return null;

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      {isVerified && (
        <span title="Verified Business" className="inline-flex items-center">
          <BadgeCheck className={cn(iconSize, 'text-blue-500')} />
        </span>
      )}
      {isSuperVendor && (
        <span title="Super Vendor" className="inline-flex items-center">
          <Star className={cn(iconSize, 'fill-amber-400 text-amber-400')} />
        </span>
      )}
    </div>
  );
}
