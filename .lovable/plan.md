Fix "Open Chat" navigation so it correctly finds existing conversations across the app by passing event_id at call sites and adding a fallback in the hook.

Changes (4 files only):

1. src/hooks/useChat.ts
   - In `startConversation`, after the existing-conversation lookup fails when `eventId` is provided, add a fallback query that searches for ANY conversation between the same user and vendor (ignoring event_id), ordered by newest first.
   - This handles conversations created without an event_id or with a different one.

2. src/pages/quotes/MyQuotes.tsx
   - In `QuoteCard.handleOpenChat`, pass `quote.request?.event_id || undefined` as the second argument to `startConversation`.

3. src/pages/bookings/ClientBookings.tsx
   - In `BookingCard.handleOpenChat`, pass `booking.event_id || undefined` as the second argument to `startConversation`.

4. src/pages/quotes/CompareQuotes.tsx
   - In `handleOpenChat`, use `quote.request?.event_id` directly with `selectedEventId` as fallback, instead of only `selectedEventId`.
   - Remove the manual fallback call to `startConversation(vendorId, undefined)` since the hook now handles that internally.

No migrations, no other files touched.