/**
 * Pure business logic functions for booking state management.
 * These functions contain no side effects and are easily testable.
 */

import { Quote, Booking, BookingStatus, PaymentStatus } from '@/types/booking';

export interface BookingPaymentStatus {
  deposit: PaymentStatus;
  balance: PaymentStatus;
}

export interface BookingInput {
  id: string;
  event_id: string;
  client_id: string;
  vendor_id: string;
  quote_id: string;
  service_category: string | null;
  agreed_price: number;
  event_date_time: string | null;
  deposit_amount: number;
  balance_amount: number;
  booking_status: BookingStatus;
  deposit_status: PaymentStatus;
  balance_status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface QuoteInput {
  id: string;
  request_id: string;
  vendor_id: string;
  price: number;
  notes: string | null;
  proposed_date_time_window: string | null;
  status: 'pending_client' | 'client_accepted' | 'client_declined' | 'expired';
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface EventInput {
  id: string;
  name: string;
  date: string | null;
  location: string | null;
}

/**
 * Creates a new Booking from an accepted Quote.
 * @param quote - The accepted quote
 * @param event - The event for the booking
 * @param clientId - The client's user ID
 * @returns A new Booking object
 */
export function createBookingFromQuote(
  quote: QuoteInput,
  event: EventInput,
  clientId: string
): BookingInput {
  if (quote.status !== 'client_accepted') {
    throw new Error('Can only create booking from an accepted quote');
  }

  const platformFee = Math.round(quote.price * 0.08 * 100) / 100;
  const totalWithFee = quote.price + platformFee;
  const depositAmount = Math.round(totalWithFee * 0.3 * 100) / 100; // 30% deposit
  const balanceAmount = Math.round((totalWithFee - depositAmount) * 100) / 100;

  return {
    id: crypto.randomUUID(),
    event_id: event.id,
    client_id: clientId,
    vendor_id: quote.vendor_id,
    quote_id: quote.id,
    service_category: null,
    agreed_price: quote.price,
    event_date_time: event.date,
    deposit_amount: depositAmount,
    balance_amount: balanceAmount,
    booking_status: 'pending_deposit',
    deposit_status: 'due',
    balance_status: 'not_due',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Marks the deposit as paid and confirms the booking.
 * @param booking - The current booking state
 * @returns Updated booking with deposit paid and confirmed status
 */
export function markDepositPaid(booking: BookingInput): BookingInput {
  if (booking.booking_status !== 'pending_deposit') {
    throw new Error('Can only mark deposit paid for pending_deposit bookings');
  }

  return {
    ...booking,
    deposit_status: 'paid',
    balance_status: 'due',
    booking_status: 'confirmed',
    updated_at: new Date().toISOString(),
  };
}

/**
 * Marks the balance as paid.
 * @param booking - The current booking state
 * @returns Updated booking with balance paid
 */
export function markBalancePaid(booking: BookingInput): BookingInput {
  if (booking.booking_status !== 'confirmed') {
    throw new Error('Can only mark balance paid for confirmed bookings');
  }

  if (booking.deposit_status !== 'paid') {
    throw new Error('Deposit must be paid before balance');
  }

  return {
    ...booking,
    balance_status: 'paid',
    updated_at: new Date().toISOString(),
  };
}

/**
 * Checks if a review can be opened for this booking.
 * Reviews can only be submitted for completed bookings.
 * @param booking - The booking to check
 * @returns true if the booking is completed and review can be opened
 */
export function canOpenReview(booking: BookingInput): boolean {
  return booking.booking_status === 'completed';
}

/**
 * Marks a booking as completed.
 * @param booking - The current booking state
 * @returns Updated booking with completed status
 */
export function markBookingCompleted(booking: BookingInput): BookingInput {
  if (booking.booking_status !== 'confirmed') {
    throw new Error('Can only complete confirmed bookings');
  }

  return {
    ...booking,
    booking_status: 'completed',
    updated_at: new Date().toISOString(),
  };
}

/**
 * Calculates the payment progress percentage.
 * @param booking - The booking to check
 * @returns Percentage of total payment completed (0, 30, or 100)
 */
export function getPaymentProgress(booking: BookingInput): number {
  if (booking.balance_status === 'paid') {
    return 100;
  }
  if (booking.deposit_status === 'paid') {
    return 30;
  }
  return 0;
}
