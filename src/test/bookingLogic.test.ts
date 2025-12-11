import { describe, it, expect } from 'vitest';
import {
  createBookingFromQuote,
  markDepositPaid,
  markBalancePaid,
  canOpenReview,
  markBookingCompleted,
  getPaymentProgress,
  QuoteInput,
  EventInput,
  BookingInput,
} from '@/lib/bookingLogic';

describe('Booking Logic', () => {
  // Test fixtures
  const mockAcceptedQuote: QuoteInput = {
    id: 'quote-1',
    request_id: 'request-1',
    vendor_id: 'vendor-1',
    price: 10000,
    notes: 'Test quote',
    proposed_date_time_window: null,
    status: 'client_accepted',
    expires_at: '2025-12-31T00:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  const mockEvent: EventInput = {
    id: 'event-1',
    name: 'Test Wedding',
    date: '2025-06-15T10:00:00Z',
    location: 'Durban, KZN',
  };

  const mockPendingBooking: BookingInput = {
    id: 'booking-1',
    event_id: 'event-1',
    client_id: 'client-1',
    vendor_id: 'vendor-1',
    quote_id: 'quote-1',
    service_category: 'catering',
    agreed_price: 10000,
    event_date_time: '2025-06-15T10:00:00Z',
    deposit_amount: 3000,
    balance_amount: 7000,
    booking_status: 'pending_deposit',
    deposit_status: 'due',
    balance_status: 'not_due',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  describe('createBookingFromQuote', () => {
    it('creates a booking with pending_deposit status from an accepted quote', () => {
      const booking = createBookingFromQuote(mockAcceptedQuote, mockEvent, 'client-1');

      expect(booking.booking_status).toBe('pending_deposit');
      expect(booking.vendor_id).toBe(mockAcceptedQuote.vendor_id);
      expect(booking.event_id).toBe(mockEvent.id);
      expect(booking.agreed_price).toBe(mockAcceptedQuote.price);
    });

    it('sets deposit as due and balance as not_due', () => {
      const booking = createBookingFromQuote(mockAcceptedQuote, mockEvent, 'client-1');

      expect(booking.deposit_status).toBe('due');
      expect(booking.balance_status).toBe('not_due');
    });

    it('calculates deposit as 30% and balance as 70%', () => {
      const booking = createBookingFromQuote(mockAcceptedQuote, mockEvent, 'client-1');

      expect(booking.deposit_amount).toBe(3000); // 30% of 10000
      expect(booking.balance_amount).toBe(7000); // 70% of 10000
    });

    it('throws error if quote is not accepted', () => {
      const pendingQuote = { ...mockAcceptedQuote, status: 'pending_client' as const };

      expect(() => createBookingFromQuote(pendingQuote, mockEvent, 'client-1')).toThrow(
        'Can only create booking from an accepted quote'
      );
    });
  });

  describe('markDepositPaid', () => {
    it('marks deposit as paid and confirms the booking', () => {
      const updatedBooking = markDepositPaid(mockPendingBooking);

      expect(updatedBooking.deposit_status).toBe('paid');
      expect(updatedBooking.booking_status).toBe('confirmed');
    });

    it('sets balance status to due after deposit is paid', () => {
      const updatedBooking = markDepositPaid(mockPendingBooking);

      expect(updatedBooking.balance_status).toBe('due');
    });

    it('throws error if booking is not pending_deposit', () => {
      const confirmedBooking = { ...mockPendingBooking, booking_status: 'confirmed' as const };

      expect(() => markDepositPaid(confirmedBooking)).toThrow(
        'Can only mark deposit paid for pending_deposit bookings'
      );
    });
  });

  describe('markBalancePaid', () => {
    const confirmedBooking: BookingInput = {
      ...mockPendingBooking,
      booking_status: 'confirmed',
      deposit_status: 'paid',
      balance_status: 'due',
    };

    it('marks balance as paid for confirmed bookings', () => {
      const updatedBooking = markBalancePaid(confirmedBooking);

      expect(updatedBooking.balance_status).toBe('paid');
    });

    it('throws error if booking is not confirmed', () => {
      const pendingBooking = { ...confirmedBooking, booking_status: 'pending_deposit' as const };

      expect(() => markBalancePaid(pendingBooking)).toThrow(
        'Can only mark balance paid for confirmed bookings'
      );
    });

    it('throws error if deposit is not paid', () => {
      const unpaidDeposit = { ...confirmedBooking, deposit_status: 'due' as const };

      expect(() => markBalancePaid(unpaidDeposit)).toThrow('Deposit must be paid before balance');
    });
  });

  describe('canOpenReview', () => {
    it('returns false for pending_deposit status', () => {
      const booking = { ...mockPendingBooking, booking_status: 'pending_deposit' as const };
      expect(canOpenReview(booking)).toBe(false);
    });

    it('returns false for confirmed status', () => {
      const booking = { ...mockPendingBooking, booking_status: 'confirmed' as const };
      expect(canOpenReview(booking)).toBe(false);
    });

    it('returns false for cancelled status', () => {
      const booking = { ...mockPendingBooking, booking_status: 'cancelled' as const };
      expect(canOpenReview(booking)).toBe(false);
    });

    it('returns false for disputed status', () => {
      const booking = { ...mockPendingBooking, booking_status: 'disputed' as const };
      expect(canOpenReview(booking)).toBe(false);
    });

    it('returns true only for completed status', () => {
      const booking = { ...mockPendingBooking, booking_status: 'completed' as const };
      expect(canOpenReview(booking)).toBe(true);
    });
  });

  describe('markBookingCompleted', () => {
    it('marks a confirmed booking as completed', () => {
      const confirmedBooking = { ...mockPendingBooking, booking_status: 'confirmed' as const };
      const completedBooking = markBookingCompleted(confirmedBooking);

      expect(completedBooking.booking_status).toBe('completed');
    });

    it('throws error for non-confirmed bookings', () => {
      expect(() => markBookingCompleted(mockPendingBooking)).toThrow(
        'Can only complete confirmed bookings'
      );
    });
  });

  describe('getPaymentProgress', () => {
    it('returns 0 when nothing is paid', () => {
      expect(getPaymentProgress(mockPendingBooking)).toBe(0);
    });

    it('returns 30 when deposit is paid', () => {
      const depositPaid = { ...mockPendingBooking, deposit_status: 'paid' as const };
      expect(getPaymentProgress(depositPaid)).toBe(30);
    });

    it('returns 100 when balance is paid', () => {
      const fullyPaid = {
        ...mockPendingBooking,
        deposit_status: 'paid' as const,
        balance_status: 'paid' as const,
      };
      expect(getPaymentProgress(fullyPaid)).toBe(100);
    });
  });
});
