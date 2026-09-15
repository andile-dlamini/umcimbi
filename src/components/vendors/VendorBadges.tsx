import { BadgeCheck, PartyPopper, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

interface VendorBadgesProps {
  businessVerificationStatus?: string | null;
  completedBookings?: number;
  respondsQuickly?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function VendorBadges({
  businessVerificationStatus,
  completedBookings = 0,
  respondsQuickly = false,
  className,
  size = 'sm'
}: VendorBadgesProps) {
  const isVerified = businessVerificationStatus === 'verified';
  const hasCompleted = (completedBookings ?? 0) > 0;

  if (!isVerified && !hasCompleted && !respondsQuickly) return null;

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
              Registered Business – UMCIMBI has verified this vendor's company registration documents
            </TooltipContent>
          </Tooltip>
        )}

        {hasCompleted && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-0.5">
                <PartyPopper className={cn(iconSize, 'text-emerald-600')} />
                <span className="text-xs font-medium text-emerald-600">{completedBookings}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px] text-center">
              {`This vendor has completed ${completedBookings} ${completedBookings === 1 ? 'ceremony' : 'ceremonies'} booked through UMCIMBI`}
            </TooltipContent>
          </Tooltip>
        )}

        {respondsQuickly && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center">
                <Zap className={cn(iconSize, 'text-amber-500')} />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px] text-center">
              This vendor usually replies to quotation requests within a day
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
