Three focused edits to surface balance payment state in conversation status chips.

## 1. `src/hooks/useChat.ts`
- In the latest-booking query (~line 93), change select from `'booking_status'` to `'booking_status, balance_status'`.
- In the returned enriched conversation object (~line 128), add `balance_status: latestBooking?.balance_status ?? null`.

## 2. `src/pages/chat/ChatsList.tsx`
- On the `<ConversationStatusChip />` usages at lines 155 and 234, pass `balanceStatus={(conv as any).balance_status}` and `balanceStatus={(latestConv as any).balance_status}` respectively.

## 3. `src/components/chat/ConversationStatusChip.tsx`
- Add `balanceStatus?: string | null` to `ConversationStatusChipProps`.
- Replace the component body with a special-case branch: when `bookingStatus === 'confirmed'`, render "All Settled" (emerald) if `balanceStatus === 'paid'`, otherwise "Balance Due" (amber). All other branches (statusMap, quoteMap, fallback Negotiating) remain unchanged.

No other files or logic touched.
