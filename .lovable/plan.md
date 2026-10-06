# Add an "Other" ceremony type

Organisers can pick "Other" (e.g. a white wedding) when creating a ceremony.

## Changes
1. New migration containing only: `ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'other';`
2. `src/types/database.ts` — add `'other'` to `EventType`; append EVENT_TYPES entry `{ id: 'other', label: 'Other', shortLabel: 'Other', description: 'Another celebration or ceremony', icon: 'Users' }`.
3. `src/components/shared/EventCard.tsx` and `src/pages/events/CreateEvent.tsx` — add `other: 'bg-accent/20 text-accent border border-accent/50'` as last colorMap entry.
4. `src/pages/events/tabs/BookVendorsTab.tsx` — add `other` to CEREMONY_VENDOR_MAP with the full 11-category list from the brief.

## Not changed
templates.ts, CeremonyJourney.tsx, RequestQuoteDialog.tsx, other migrations/RLS/edge functions.

Note: the project memory restricting ceremonies to the 7 named types will be updated to allow "Other" (funerals still excluded).
