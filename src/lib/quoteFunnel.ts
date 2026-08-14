/**
 * Derived funnel stage for a quote.
 *
 * The stage an admin needs in one column does not exist as a single field —
 * it is derived from the service request, quote and booking status columns.
 * Booking-level terminal states are evaluated first so a booking that reached
 * deposit is never reported as merely Quoted, and a cancelled booking never
 * sits in Accepted inflating the funnel.
 */

export type FunnelStage =
  | 'Requested'
  | 'Quoted'
  | 'Accepted'
  | 'Deposit paid'
  | 'Completed'
  | 'Disputed'
  | 'Lost';

/** Stages in funnel order, for sorting and grouping in the UI. */
export const FUNNEL_STAGES: FunnelStage[] = [
  'Requested',
  'Quoted',
  'Accepted',
  'Deposit paid',
  'Completed',
  'Disputed',
  'Lost',
];

/** Badge classes per stage so screens do not each invent their own colours. */
export const FUNNEL_STAGE_CLASSES: Record<FunnelStage, string> = {
  Requested: 'bg-muted text-muted-foreground border-border',
  Quoted: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  Accepted: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  'Deposit paid': 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30',
  Completed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  Disputed: 'bg-destructive/15 text-destructive border-destructive/30',
  Lost: 'bg-muted text-muted-foreground border-border line-through decoration-muted-foreground/50',
};

export interface QuoteStageInput {
  quoteStatus?: string | null;
  requestStatus?: string | null;
  bookingStatus?: string | null;
  depositStatus?: string | null;
}

const LOST_QUOTE_STATUSES = ['client_declined', 'expired'];
const LOST_REQUEST_STATUSES = ['declined', 'vendor_declined', 'expired', 'cancelled'];

export function getQuoteStage({
  quoteStatus,
  requestStatus,
  bookingStatus,
  depositStatus,
}: QuoteStageInput): FunnelStage {
  // 1-4: booking-level states first.
  if (bookingStatus === 'disputed') return 'Disputed';
  if (bookingStatus === 'completed') return 'Completed';
  if (bookingStatus === 'cancelled') return 'Lost';
  if (depositStatus === 'paid' || bookingStatus === 'confirmed') return 'Deposit paid';

  // 5: terminal quote / request states before Accepted.
  if (quoteStatus && LOST_QUOTE_STATUSES.includes(quoteStatus)) return 'Lost';
  if (requestStatus && LOST_REQUEST_STATUSES.includes(requestStatus)) return 'Lost';

  // 6-8.
  if (quoteStatus === 'client_accepted') return 'Accepted';
  if (quoteStatus === 'pending_client' || quoteStatus === 'adjustment_requested') return 'Quoted';
  if (!quoteStatus && requestStatus === 'pending') return 'Requested';

  return 'Requested';
}
