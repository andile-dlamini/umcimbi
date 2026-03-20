import { BadgeCheck, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

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
    <TooltipProvider delayDuration={300}>
      <div className={cn('inline-flex items-center gap-1', className)}>
        {isVerified && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center">
                <BadgeCheck className={cn(iconSize, 'text-blue-500')} />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px] text-center">
              Verified – UMCIMBI has verified this vendor's company registration documents
            </TooltipContent>
          </Tooltip>
        )}
        {isSuperVendor && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center">
                <Star className={cn(iconSize, 'fill-amber-400 text-amber-400')} />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px] text-center">
              Super Vendor – Awarded automatically for completing 20+ jobs with a 4.8+ rating
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
