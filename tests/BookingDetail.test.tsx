import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from './test-utils';

// Booking detail component for testing
interface Booking {
  id: string;
  vendorName: string;
  agreedPrice: number;
  depositAmount: number;
  balanceAmount: number;
  bookingStatus: 'pending_deposit' | 'confirmed' | 'completed' | 'cancelled' | 'disputed';
  depositStatus: 'not_due' | 'due' | 'paid';
  balanceStatus: 'not_due' | 'due' | 'paid';
}

interface BookingDetailProps {
  booking: Booking;
  onMarkDepositPaid: () => void;
  onMarkBalancePaid: () => void;
  onOpenReview: () => void;
}

function BookingDetail({ booking, onMarkDepositPaid, onMarkBalancePaid, onOpenReview }: BookingDetailProps) {
  const canReview = booking.bookingStatus === 'completed';

  return (
    <div data-testid="booking-detail">
      <h1 data-testid="vendor-name">{booking.vendorName}</h1>
      <p data-testid="agreed-price">R{booking.agreedPrice.toLocaleString()}</p>
      <span data-testid="booking-status">{booking.bookingStatus}</span>

      {/* Deposit Section */}
      <div data-testid="deposit-section">
        <span data-testid="deposit-amount">R{booking.depositAmount.toLocaleString()}</span>
        <span data-testid="deposit-status">
          {booking.depositStatus === 'due' ? 'Deposit due' : `Deposit ${booking.depositStatus}`}
        </span>
        {booking.depositStatus === 'due' && booking.bookingStatus === 'pending_deposit' && (
          <button data-testid="mark-deposit-paid" onClick={onMarkDepositPaid}>
            Mark deposit paid
          </button>
        )}
      </div>

      {/* Balance Section */}
      <div data-testid="balance-section">
        <span data-testid="balance-amount">R{booking.balanceAmount.toLocaleString()}</span>
        <span data-testid="balance-status">
          {booking.balanceStatus === 'due' ? 'Balance due' : `Balance ${booking.balanceStatus}`}
        </span>
        {booking.balanceStatus === 'due' && booking.bookingStatus === 'confirmed' && (
          <button data-testid="mark-balance-paid" onClick={onMarkBalancePaid}>
            Mark balance paid
          </button>
        )}
      </div>

      {/* Review Button */}
      {canReview && (
        <button data-testid="rate-vendor-button" onClick={onOpenReview}>
          Rate this vendor
        </button>
      )}
    </div>
  );
}

describe('BookingDetail Component', () => {
  const createBooking = (overrides: Partial<Booking> = {}): Booking => ({
    id: 'booking-1',
    vendorName: 'Test Caterers',
    agreedPrice: 10000,
    depositAmount: 3000,
    balanceAmount: 7000,
    bookingStatus: 'pending_deposit',
    depositStatus: 'due',
    balanceStatus: 'not_due',
    ...overrides,
  });

  describe('Pending Deposit State', () => {
    it('shows "Deposit due" when deposit is due', () => {
      const booking = createBooking({ bookingStatus: 'pending_deposit', depositStatus: 'due' });

      renderWithProviders(
        <BookingDetail
          booking={booking}
          onMarkDepositPaid={vi.fn()}
          onMarkBalancePaid={vi.fn()}
          onOpenReview={vi.fn()}
        />
      );

      expect(screen.getByTestId('deposit-status')).toHaveTextContent('Deposit due');
    });

    it('shows "Mark deposit paid" button', () => {
      const booking = createBooking({ bookingStatus: 'pending_deposit', depositStatus: 'due' });

      renderWithProviders(
        <BookingDetail
          booking={booking}
          onMarkDepositPaid={vi.fn()}
          onMarkBalancePaid={vi.fn()}
          onOpenReview={vi.fn()}
        />
      );

      expect(screen.getByTestId('mark-deposit-paid')).toBeInTheDocument();
    });

    it('calls onMarkDepositPaid when button clicked', () => {
      const onMarkDepositPaid = vi.fn();
      const booking = createBooking({ bookingStatus: 'pending_deposit', depositStatus: 'due' });

      renderWithProviders(
        <BookingDetail
          booking={booking}
          onMarkDepositPaid={onMarkDepositPaid}
          onMarkBalancePaid={vi.fn()}
          onOpenReview={vi.fn()}
        />
      );

      fireEvent.click(screen.getByTestId('mark-deposit-paid'));
      expect(onMarkDepositPaid).toHaveBeenCalledTimes(1);
    });
  });

  describe('Completed State', () => {
    it('shows "Rate this vendor" button when completed', () => {
      const booking = createBooking({
        bookingStatus: 'completed',
        depositStatus: 'paid',
        balanceStatus: 'paid',
      });

      renderWithProviders(
        <BookingDetail
          booking={booking}
          onMarkDepositPaid={vi.fn()}
          onMarkBalancePaid={vi.fn()}
          onOpenReview={vi.fn()}
        />
      );

      expect(screen.getByTestId('rate-vendor-button')).toBeInTheDocument();
    });

    it('calls onOpenReview when Rate button clicked', () => {
      const onOpenReview = vi.fn();
      const booking = createBooking({ bookingStatus: 'completed' });

      renderWithProviders(
        <BookingDetail
          booking={booking}
          onMarkDepositPaid={vi.fn()}
          onMarkBalancePaid={vi.fn()}
          onOpenReview={onOpenReview}
        />
      );

      fireEvent.click(screen.getByTestId('rate-vendor-button'));
      expect(onOpenReview).toHaveBeenCalledTimes(1);
    });
  });

  describe('Non-Completed States', () => {
    const statuses: Booking['bookingStatus'][] = ['pending_deposit', 'confirmed', 'cancelled', 'disputed'];

    statuses.forEach((status) => {
      it(`hides review button when status is ${status}`, () => {
        const booking = createBooking({ bookingStatus: status });

        renderWithProviders(
          <BookingDetail
            booking={booking}
            onMarkDepositPaid={vi.fn()}
            onMarkBalancePaid={vi.fn()}
            onOpenReview={vi.fn()}
          />
        );

        expect(screen.queryByTestId('rate-vendor-button')).not.toBeInTheDocument();
      });
    });
  });

  describe('Confirmed State', () => {
    it('shows "Mark balance paid" button when balance is due', () => {
      const booking = createBooking({
        bookingStatus: 'confirmed',
        depositStatus: 'paid',
        balanceStatus: 'due',
      });

      renderWithProviders(
        <BookingDetail
          booking={booking}
          onMarkDepositPaid={vi.fn()}
          onMarkBalancePaid={vi.fn()}
          onOpenReview={vi.fn()}
        />
      );

      expect(screen.getByTestId('mark-balance-paid')).toBeInTheDocument();
    });
  });
});
