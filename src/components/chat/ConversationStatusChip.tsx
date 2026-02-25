import { Badge } from '@/components/ui/badge';

interface ConversationStatusChipProps {
  bookingStatus?: string | null;
  quoteStatus?: string | null;
}

const statusMap: Record<string, { label: string; className: string }> = {
  completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300' },
  confirmed: { label: 'Booked', className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300' },
  pending_deposit: { label: 'Deposit Due', className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300' },
  disputed: { label: 'Disputed', className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400' },
};

const quoteMap: Record<string, { label: string; className: string }> = {
  pending_client: { label: 'Quote Sent', className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300' },
  client_accepted: { label: 'Accepted', className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300' },
  client_declined: { label: 'Declined', className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300' },
  expired: { label: 'Expired', className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400' },
};

export function ConversationStatusChip({ bookingStatus, quoteStatus }: ConversationStatusChipProps) {
  // Booking status takes precedence
  if (bookingStatus && statusMap[bookingStatus]) {
    const s = statusMap[bookingStatus];
    return <Badge className={`text-[10px] px-1.5 py-0 ${s.className}`}>{s.label}</Badge>;
  }

  if (quoteStatus && quoteMap[quoteStatus]) {
    const s = quoteMap[quoteStatus];
    return <Badge className={`text-[10px] px-1.5 py-0 ${s.className}`}>{s.label}</Badge>;
  }

  return <Badge variant="outline" className="text-[10px] px-1.5 py-0">Negotiating</Badge>;
}
