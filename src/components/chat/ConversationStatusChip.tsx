import { Badge } from '@/components/ui/badge';

interface ConversationStatusChipProps {
  bookingStatus?: string | null;
  balanceStatus?: string | null;
  quoteStatus?: string | null;
}

const AMBER = 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300';
const EMERALD = 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300';
const RED = 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300';
const GRAY = 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400';

const quoteMap: Record<string, { label: string; className: string }> = {
  pending_client: { label: 'Quote Sent', className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300' },
  adjustment_requested: { label: '⚠ Adjustment Needed', className: 'bg-amber-200 text-amber-900 border-amber-400 font-bold animate-pulse dark:bg-amber-800/50 dark:text-amber-200 dark:border-amber-600' },
  client_accepted: { label: 'Accepted', className: EMERALD },
  client_declined: { label: 'Declined', className: RED },
  expired: { label: 'Expired', className: GRAY },
};

function bookingChip(
  bookingStatus: string,
  balanceStatus?: string | null
): { label: string; className: string } | null {
  switch (bookingStatus) {
    case 'pending_deposit':
      return { label: 'Deposit Due', className: AMBER };
    case 'confirmed':
      return balanceStatus === 'paid'
        ? { label: 'All Settled', className: EMERALD }
        : { label: 'Balance Due', className: AMBER };
    case 'completed':
      return { label: 'Completed', className: EMERALD };
    case 'disputed':
      return { label: 'Disputed', className: RED };
    case 'cancelled':
      return { label: 'Cancelled', className: GRAY };
    default:
      return null;
  }
}

export function ConversationStatusChip({ bookingStatus, balanceStatus, quoteStatus }: ConversationStatusChipProps) {
  if (bookingStatus) {
    const s = bookingChip(bookingStatus, balanceStatus);
    if (s) return <Badge className={`text-[10px] px-1.5 py-0 ${s.className}`}>{s.label}</Badge>;
  }

  if (quoteStatus && quoteMap[quoteStatus]) {
    const s = quoteMap[quoteStatus];
    return <Badge className={`text-[10px] px-1.5 py-0 ${s.className}`}>{s.label}</Badge>;
  }

  return <Badge variant="outline" className="text-[10px] px-1.5 py-0">Negotiating</Badge>;
}
