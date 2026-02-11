import { describe, it, expect } from 'vitest';
import { quoteStatusConfig, bookingStatusConfig, serviceRequestStatusConfig, paymentStatusConfig } from '@/lib/statusConfig';
import type { QuoteStatus, BookingStatus, PaymentStatus } from '@/types/booking';
import type { ServiceRequestStatus } from '@/types/database';

describe('Status config canonical coverage', () => {
  // Ensure every enum value has a corresponding UI config

  it('quoteStatusConfig covers all QuoteStatus values', () => {
    const canonicalStatuses: QuoteStatus[] = ['pending_client', 'client_accepted', 'client_declined', 'expired'];
    for (const status of canonicalStatuses) {
      expect(quoteStatusConfig[status]).toBeDefined();
      expect(quoteStatusConfig[status].label).toBeTruthy();
      expect(quoteStatusConfig[status].className).toBeTruthy();
    }
  });

  it('bookingStatusConfig covers all BookingStatus values', () => {
    const canonicalStatuses: BookingStatus[] = ['pending_deposit', 'confirmed', 'cancelled', 'completed', 'disputed'];
    for (const status of canonicalStatuses) {
      expect(bookingStatusConfig[status]).toBeDefined();
      expect(bookingStatusConfig[status].label).toBeTruthy();
    }
  });

  it('serviceRequestStatusConfig covers all ServiceRequestStatus values', () => {
    const canonicalStatuses: ServiceRequestStatus[] = [
      'pending', 'quoted', 'accepted', 'declined', 'completed', 'cancelled', 'expired', 'vendor_declined'
    ];
    for (const status of canonicalStatuses) {
      expect(serviceRequestStatusConfig[status]).toBeDefined();
      expect(serviceRequestStatusConfig[status].label).toBeTruthy();
    }
  });

  it('paymentStatusConfig covers all PaymentStatus values', () => {
    const canonicalStatuses: PaymentStatus[] = ['not_due', 'due', 'paid'];
    for (const status of canonicalStatuses) {
      expect(paymentStatusConfig[status]).toBeDefined();
      expect(paymentStatusConfig[status].label).toBeTruthy();
    }
  });
});

describe('No stale/orphan status values in configs', () => {
  it('quoteStatusConfig has no extra keys beyond canonical', () => {
    const canonical = new Set(['pending_client', 'client_accepted', 'client_declined', 'expired']);
    const actual = new Set(Object.keys(quoteStatusConfig));
    for (const key of actual) {
      expect(canonical.has(key)).toBe(true);
    }
  });

  it('bookingStatusConfig has no extra keys beyond canonical', () => {
    const canonical = new Set(['pending_deposit', 'confirmed', 'cancelled', 'completed', 'disputed']);
    const actual = new Set(Object.keys(bookingStatusConfig));
    for (const key of actual) {
      expect(canonical.has(key)).toBe(true);
    }
  });
});
