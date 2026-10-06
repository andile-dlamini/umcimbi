# Make date, guests and location required on quote requests

Vendors will always get the event date, guest count and location, and they'll see all three in their new-request chat message.

## Quote request form (RequestQuoteDialog.tsx)
- Only the ceremony dropdown shows at first. After a choice (existing or new), Date *, Expected guests * and "Event location (incl. nearest school) *" appear together. Budget and message stay optional.
- The new-ceremony section keeps only Ceremony type *. If the type is "Other", an extra required "What kind of ceremony? *" field appears and becomes the ceremony name. Other types keep the automatic name.
- Picking an existing ceremony fills in its date, guests and location. These can still be edited, and they refill when the selection changes.
- Validation: date required, guests a whole number from 1 to 10000, location required (max 200 characters). Submit stays disabled until everything required is filled in.
- When an existing ceremony is used and the date, location or guests were changed, the ceremony is updated first (`updateEvent`). New ceremonies use `createEvent` with the required values.
- Date and guest count are always sent with the request.

## Vendor notification
- `chatNotifications.ts`: replace `newRequestForVendor` with the version from the brief, which adds date and location lines.
- `useServiceRequests.ts`: also select `date, location`, format the date as dd MMM yyyy with date-fns, and pass both to the notification. Visibility metadata stays the same.

## Not changed
useEvents.ts, database structure, VendorDetail.tsx, ChatDetailsDrawer.tsx, access rules, edge functions.
