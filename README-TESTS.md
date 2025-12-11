# Isiko Planner Test Suite

## Running Tests

```bash
npm test
```

## Test Coverage

### Business Logic Tests (`src/test/bookingLogic.test.ts`)

Tests pure TypeScript functions in `src/lib/bookingLogic.ts`:

| Function | Tests |
|----------|-------|
| `createBookingFromQuote` | Creates booking with pending_deposit status, calculates 30/70 deposit split |
| `markDepositPaid` | Changes status to confirmed, sets balance as due |
| `markBalancePaid` | Validates deposit paid first, marks balance paid |
| `canOpenReview` | Returns true only for completed bookings |
| `getPaymentProgress` | Returns 0, 30, or 100 based on payment status |

## Adding New Tests

Add pure function tests to `src/test/` with `.test.ts` extension using Vitest syntax.
