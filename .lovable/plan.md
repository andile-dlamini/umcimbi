

## Plan: Fix Escrow Flow — BookingDetail Wording + Chat Booking Actions

### 1. BookingDetail.tsx — Fix vendor escrow text (line 369)
Replace the vendor-side string from "…will be released to you after the ceremony date. No action needed from you." to "Your client's balance payment is held securely by Umcimbi. Upload your proof of delivery below to release your payment."

### 2. New hook: `src/hooks/useConversationBooking.ts`
Create the hook as specified — fetches the most recent active booking (confirmed/disputed/completed) by vendor_id + client_id, plus associated delivery_proofs. Returns `booking`, `deliveryProofs`, `isLoading`, `refreshBooking`.

### 3. ChatThread.tsx — Add booking-aware action panel
- **Imports**: Add `useConversationBooking`, `Upload`, `CheckCircle`, `AlertTriangle`, `Clock` from lucide-react
- **State/hooks**: Add `activeBooking`/`bookingProofs` via the new hook, plus `isUploadingProof`, `isConfirming`, `isDisputing` state and `proofFileInputRef`
- **Handlers**: `handleProofUpload` (upload to storage → invoke edge function), `handleConfirmDelivery`, `handleRaiseDispute`
- **JSX**: Hidden file input for proof uploads before the sticky bottom div. Inside the sticky div, add the 5-state booking action panel (vendor upload, vendor waiting, client confirm/dispute, disputed, completed) as the first child — before the adjustment bar and vendor toolbar.

### Files Changed
| File | Change |
|------|--------|
| `src/pages/bookings/BookingDetail.tsx` | Edit 1 string on line 369 |
| `src/hooks/useConversationBooking.ts` | Create new file |
| `src/pages/chat/ChatThread.tsx` | Add imports, hook, handlers, JSX panel |

### What Will NOT Change
Existing file upload handler, Make Quotation button, QuoteCard, edge functions, useBookings.ts, BookingDetail upload proof section, any other files.

