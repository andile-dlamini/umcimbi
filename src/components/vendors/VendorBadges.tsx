import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

interface VendorBadgesProps {
  businessVerificationStatus?: string | null;
  isSuperVendor?: boolean; // kept for backward compatibility, no longer rendered
  className?: string;
  size?: 'sm' | 'md';
}

export function VendorBadges({
  businessVerificationStatus,
  className,
  size = 'sm'
}: VendorBadgesProps) {
  const isVerified = businessVerificationStatus === 'verified';
  if (!isVerified) return null;
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn('inline-flex items-center gap-1', className)}>
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
      </div>
    </TooltipProvider>
  );
}
