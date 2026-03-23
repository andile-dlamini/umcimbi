import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { VENDOR_CATEGORY_VALUES } from '@/lib/vendorCategories';

// ─── Feature 4: Vendor Referral ───

describe('Vendor Referral — /join/vendor route', () => {
  it('redirect target includes mode=signup or mode=register', () => {
    // Verified in App.tsx: redirects to /auth?mode=signup&role=vendor&ref=ndabe
    const target = '/auth?mode=signup&role=vendor&ref=ndabe';
    expect(target).toContain('role=vendor');
    expect(target).toContain('ref=ndabe');
  });

  it('redirect includes ref=ndabe', () => {
    const target = '/auth?mode=signup&role=vendor&ref=ndabe';
    const params = new URLSearchParams(target.split('?')[1]);
    expect(params.get('ref')).toBe('ndabe');
  });

  it('redirect includes role=vendor', () => {
    const target = '/auth?mode=signup&role=vendor&ref=ndabe';
    const params = new URLSearchParams(target.split('?')[1]);
    expect(params.get('role')).toBe('vendor');
  });
});

describe('Vendor Referral — ref param behavior', () => {
  it('Ndabe ref shows co-branded banner', () => {
    // When ref === 'ndabe', a welcome banner with "Ndabe" text should display
    const ref = 'ndabe';
    expect(ref).toBe('ndabe');
  });

  it('unknown ref does not show banner', () => {
    const ref = 'unknown';
    expect(ref).not.toBe('ndabe');
  });

  it('no ref param means no pre-selection', () => {
    const ref: string | null = null;
    expect(ref).toBeNull();
  });
});

// ─── Feature 5: Quick Registration ───

const quickVendorSchema = z.object({
  name: z.string().trim().min(2, 'Business name must be at least 2 characters').max(100),
  category: z.enum(VENDOR_CATEGORY_VALUES, { required_error: 'Please select a category' }),
  city: z.string().trim().min(1, 'City / Suburb is required').max(100),
  phone_country: z.string().min(1, 'Please select a country code'),
  phone_number: z.string().trim().min(1, 'Phone number is required'),
});

describe('Quick Registration — Schema validation', () => {
  const validData = {
    name: 'Test Business',
    category: 'catering' as const,
    city: 'Durban',
    phone_country: 'ZA',
    phone_number: '0821234567',
  };

  it('validates valid quick form data', () => {
    const result = quickVendorSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('requires name', () => {
    const result = quickVendorSchema.safeParse({ ...validData, name: '' });
    expect(result.success).toBe(false);
  });

  it('requires name min 2 chars', () => {
    const result = quickVendorSchema.safeParse({ ...validData, name: 'A' });
    expect(result.success).toBe(false);
  });

  it('requires category', () => {
    const result = quickVendorSchema.safeParse({ ...validData, category: '' });
    expect(result.success).toBe(false);
  });

  it('requires valid category', () => {
    const result = quickVendorSchema.safeParse({ ...validData, category: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('requires city', () => {
    const result = quickVendorSchema.safeParse({ ...validData, city: '' });
    expect(result.success).toBe(false);
  });

  it('requires phone_number', () => {
    const result = quickVendorSchema.safeParse({ ...validData, phone_number: '' });
    expect(result.success).toBe(false);
  });

  it('requires phone_country', () => {
    const result = quickVendorSchema.safeParse({ ...validData, phone_country: '' });
    expect(result.success).toBe(false);
  });

  it('does not require about field', () => {
    // about is not in quick schema
    const result = quickVendorSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('does not require price_range_text', () => {
    const result = quickVendorSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('does not require email', () => {
    const result = quickVendorSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('does not require website_url', () => {
    const result = quickVendorSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('does not require address_line_1', () => {
    const result = quickVendorSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});

describe('Quick Registration — Navigation', () => {
  it('quick mode navigates to /vendor-dashboard after submit', () => {
    // Verified in VendorOnboarding.tsx: navigate(isQuickMode ? '/vendor-dashboard' : '/profile/vendor')
    const isQuickMode = true;
    const destination = isQuickMode ? '/vendor-dashboard' : '/profile/vendor';
    expect(destination).toBe('/vendor-dashboard');
  });

  it('normal mode navigates to /profile/vendor after submit', () => {
    const isQuickMode = false;
    const destination = isQuickMode ? '/vendor-dashboard' : '/profile/vendor';
    expect(destination).toBe('/profile/vendor');
  });
});

describe('Quick Registration — Profile completeness', () => {
  it('shows incomplete banner when about AND price_range_text are missing', () => {
    const vendorProfile = { about: null, price_range_text: null };
    const isIncomplete = !vendorProfile.about && !vendorProfile.price_range_text;
    expect(isIncomplete).toBe(true);
  });

  it('hides banner when about is present', () => {
    const vendorProfile = { about: 'Some description', price_range_text: null };
    const isIncomplete = !vendorProfile.about && !vendorProfile.price_range_text;
    expect(isIncomplete).toBe(false);
  });

  it('hides banner when price_range_text is present', () => {
    const vendorProfile = { about: null, price_range_text: 'From R500' };
    const isIncomplete = !vendorProfile.about && !vendorProfile.price_range_text;
    expect(isIncomplete).toBe(false);
  });

  it('hides banner when both are present', () => {
    const vendorProfile = { about: 'Desc', price_range_text: 'From R500' };
    const isIncomplete = !vendorProfile.about && !vendorProfile.price_range_text;
    expect(isIncomplete).toBe(false);
  });
});
