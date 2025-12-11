# Isiko Planner Test Suite

## Running Tests

```bash
npm test
```

## Test Files

| File | Description | Coverage |
|------|-------------|----------|
| `src/test/bookingLogic.test.ts` | Pure business logic | Booking state transitions, payments, review eligibility |
| `tests/QuotesList.test.tsx` | Quotes display | Viewing, accepting, declining quotes |
| `tests/BookingDetail.test.tsx` | Booking details | Payment status, review button visibility |
| `tests/RequestFlow.test.tsx` | Quote request form | Form submission, validation errors |
| `tests/VendorProfileReviews.test.tsx` | Vendor reviews | Rating display, review submission |

## Business Logic Tests

Located in `src/test/bookingLogic.test.ts`:

- **`createBookingFromQuote`** - Creates booking from accepted quote with correct status
- **`markDepositPaid`** - Updates payment and booking status
- **`markBalancePaid`** - Validates deposit paid first
- **`canOpenReview`** - Returns true only for completed bookings

## Component Tests

Located in `tests/` folder (outside src/ to avoid build conflicts):

### QuotesList
- Renders quotes with vendor names and prices
- Accept/Decline button interactions
- Status badge display

### BookingDetail
- Deposit/balance status display
- Payment action buttons
- Review button visibility rules

### RequestFlow
- Form submission with validation
- Success/error message display

### VendorProfileReviews
- Average rating calculation
- "No reviews yet" state
- Review submission flow

## Adding New Tests

For business logic: Add to `src/test/` with `.test.ts`
For components: Add to `tests/` with `.test.tsx`
