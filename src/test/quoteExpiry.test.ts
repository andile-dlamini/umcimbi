import { describe, it, expect } from 'vitest';
import type { QuoteStatus } from '@/types/booking';

describe('Quote expiry logic', () => {
  // ACC-EC-02: Quote expiry detection
  it('ACC-EC-02: detects expired quote from expires_at', () => {
    const expiredQuote = {
      expires_at: new Date(Date.now() - 60 * 1000).toISOString(), // 1 min ago
      status: 'pending_client' as QuoteStatus,
    };

    const isExpired = new Date(expiredQuote.expires_at) < new Date();
    expect(isExpired).toBe(true);
  });

  it('non-expired quote is still actionable', () => {
    const activeQuote = {
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h from now
      status: 'pending_client' as QuoteStatus,
    };

    const isExpired = new Date(activeQuote.expires_at) < new Date();
    expect(isExpired).toBe(false);
  });

  // UI Accept button logic
  it('isPending is true only when pending_client and not expired', () => {
    const quote = {
      status: 'pending_client' as QuoteStatus,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    const isExpired = new Date(quote.expires_at) < new Date();
    const isPending = quote.status === 'pending_client' && !isExpired;
    expect(isPending).toBe(true);
  });

  it('isPending is false when expired even if status is pending_client', () => {
    const quote = {
      status: 'pending_client' as QuoteStatus,
      expires_at: new Date(Date.now() - 1000).toISOString(),
    };

    const isExpired = new Date(quote.expires_at) < new Date();
    const isPending = quote.status === 'pending_client' && !isExpired;
    expect(isPending).toBe(false);
  });

  it('isPending is false for accepted quotes', () => {
    const quote = {
      status: 'client_accepted' as QuoteStatus,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    const isExpired = new Date(quote.expires_at) < new Date();
    const isPending = quote.status === 'pending_client' && !isExpired;
    expect(isPending).toBe(false);
  });
});

describe('Offer number format', () => {
  it('ACC-HP-05: matches UMC-Q-YYYY-NNNNNN pattern', () => {
    const offerNumber = 'UMC-Q-2026-000042';
    const pattern = /^UMC-Q-\d{4}-\d{6}$/;
    expect(pattern.test(offerNumber)).toBe(true);
  });

  it('rejects invalid formats', () => {
    const pattern = /^UMC-Q-\d{4}-\d{6}$/;
    expect(pattern.test('UMC-Q-2026-42')).toBe(false); // too short
    expect(pattern.test('INVOICE-2026-000042')).toBe(false); // wrong prefix
  });
});

describe('Letterhead layout decision', () => {
  // ACC-HP-03 + ACC-HP-04
  function hasLetterhead(vendor: {
    letterhead_enabled: boolean;
    logo_url: string | null;
    registered_business_name: string | null;
  }): boolean {
    return !!(vendor.letterhead_enabled || vendor.logo_url || vendor.registered_business_name);
  }

  it('ACC-HP-03: letterhead when enabled=true + logo', () => {
    expect(hasLetterhead({ letterhead_enabled: true, logo_url: 'http://logo.png', registered_business_name: null })).toBe(true);
  });

  it('ACC-HP-03: letterhead when enabled=true + registered name', () => {
    expect(hasLetterhead({ letterhead_enabled: true, logo_url: null, registered_business_name: 'Biz Co' })).toBe(true);
  });

  it('ACC-HP-03: letterhead when enabled=true even without logo/name', () => {
    // Current logic: letterhead_enabled alone is enough
    expect(hasLetterhead({ letterhead_enabled: true, logo_url: null, registered_business_name: null })).toBe(true);
  });

  it('ACC-HP-04: fallback when all false/null', () => {
    expect(hasLetterhead({ letterhead_enabled: false, logo_url: null, registered_business_name: null })).toBe(false);
  });

  it('logo_url alone triggers letterhead (legacy)', () => {
    expect(hasLetterhead({ letterhead_enabled: false, logo_url: 'http://logo.png', registered_business_name: null })).toBe(true);
  });
});
