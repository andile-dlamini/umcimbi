/**
 * Balance due date rule, shared by every client-side payment path.
 *
 * The platform promises the balance is due five days before the ceremony, so
 * the due date is derived from bookings.event_date_time — never "now".
 *
 * NOTE: supabase/functions/ozow-webhook/index.ts holds a parallel
 * implementation of this exact rule (it cannot import from src/). If this
 * changes, that copy must be kept in sync.
 */
export function deriveBalanceDueAt(eventDateTime: string | null | undefined): string {
  const now = new Date();
  if (!eventDateTime) return now.toISOString();
  const due = new Date(new Date(eventDateTime).getTime() - 5 * 24 * 60 * 60 * 1000);
  return due > now ? due.toISOString() : now.toISOString();
}
