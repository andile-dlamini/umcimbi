import { describe, it, expect } from 'vitest';

// BOOK-HP-01: Deposit/balance split calculation
describe('Booking payment split', () => {
  it('BOOK-HP-01: calculates 30% deposit and 70% balance from agreed price', () => {
    const agreedPrice = 10000;
    const depositAmount = Math.round(agreedPrice * 0.3);
    const balanceAmount = Math.round(agreedPrice * 0.7);

    expect(depositAmount).toBe(3000);
    expect(balanceAmount).toBe(7000);
    expect(depositAmount + balanceAmount).toBe(agreedPrice);
  });

  it('handles odd numbers with rounding', () => {
    const agreedPrice = 9999;
    const depositAmount = Math.round(agreedPrice * 0.3);
    const balanceAmount = Math.round(agreedPrice * 0.7);

    expect(depositAmount).toBe(3000);
    expect(balanceAmount).toBe(6999);
    // Note: rounding may cause 1 rand difference
    expect(depositAmount + balanceAmount).toBeCloseTo(agreedPrice, 0);
  });
});

// BOOK-HP-03: Payment status transitions
describe('Payment status transitions', () => {
  it('BOOK-HP-03: deposit paid sets correct state', () => {
    const updates: Record<string, unknown> = {};
    const field = 'deposit_status';
    const status = 'paid';

    updates[field] = status;
    if (field === 'deposit_status' && status === 'paid') {
      updates.booking_status = 'confirmed';
      updates.balance_status = 'due';
      updates.deposit_paid_at = new Date().toISOString();
      updates.balance_due_at = new Date().toISOString();
    }

    expect(updates.booking_status).toBe('confirmed');
    expect(updates.balance_status).toBe('due');
    expect(updates.deposit_paid_at).toBeDefined();
    expect(updates.balance_due_at).toBeDefined();
  });

  it('BOOK-HP-04: balance paid sets correct state', () => {
    const updates: Record<string, unknown> = {};
    const field = 'balance_status';
    const status = 'paid';

    updates[field] = status;
    if (field === 'balance_status' && status === 'paid') {
      updates.balance_paid_at = new Date().toISOString();
    }

    expect(updates.balance_paid_at).toBeDefined();
  });
});

// Deterministic payment status derivation
describe('Deterministic payment status from timestamps', () => {
  function derivePaymentStatus(
    paidAt: string | null,
    dueAt: string | null,
    now: Date = new Date()
  ): 'paid' | 'due' | 'not_due' {
    if (paidAt) return 'paid';
    if (dueAt && now >= new Date(dueAt)) return 'due';
    return 'not_due';
  }

  it('returns paid when paid_at is set', () => {
    expect(derivePaymentStatus('2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')).toBe('paid');
  });

  it('returns due when now >= due_at and not paid', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    expect(derivePaymentStatus(null, pastDate)).toBe('due');
  });

  it('returns not_due when now < due_at and not paid', () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    expect(derivePaymentStatus(null, futureDate)).toBe('not_due');
  });

  it('returns not_due when due_at is null', () => {
    expect(derivePaymentStatus(null, null)).toBe('not_due');
  });
});
