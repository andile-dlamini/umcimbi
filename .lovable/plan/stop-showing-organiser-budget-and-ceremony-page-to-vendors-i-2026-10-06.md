# Stop showing organiser budget and ceremony page to vendors in the chat details drawer

## What changes

In the chat ⓘ drawer, the Event Summary card is currently identical for both sides. A vendor opening it sees the organiser's estimated budget and a "View Event" button that takes them into the organiser's ceremony page.

Two small gates, using the `isClient` value the drawer already computes:

1. **Budget line** — shown only to the organiser (client). Vendors no longer see "R…".
2. **"View Event" button** — shown only to the organiser. Vendors no longer get a link into the ceremony page.

Everything else in the card stays visible to both roles: ceremony name, date, location, and guest count — the vendor needs those to quote and prepare.

## Result

- Vendor view: name, date, location, guests. No budget, no View Event button.
- Organiser view: unchanged — everything still shows, including budget and View Event.
- No other screen, message, quote, booking, or payment behaviour is affected.

## Technical details

File: `src/components/chat/ChatDetailsDrawer.tsx` (only file touched)

- Line 270: `{event.estimated_budget && (` becomes `{isClient && event.estimated_budget && (`.
- Lines 276–278: the `<Button … View Event …>` is wrapped in `{isClient && ( … )}`.
- `isClient` (line 151, `const isClient = !isVendorView;`) already exists — no new state, props, or imports.
- The `Banknote` and `ExternalLink` imports remain in use, so nothing becomes unused.

Deliberately out of scope (per your instruction):

- No RLS policy or migration change — the database-side fix stays a separate task.
- No change to the drawer's data fetching, so the event row (including budget) is still returned to the vendor's browser and simply not rendered. Hiding it in the UI is this task; removing it from the payload belongs to the policy task.
- `ChatThread.tsx` and other chat components untouched.

## Verification

- Typecheck/build passes.
- Open the drawer as an organiser: budget and View Event present.
- Open the same thread as the vendor: budget line absent, View Event absent, name/date/location/guests present.
