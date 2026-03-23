import { describe, it, expect } from 'vitest';
import { PRICING_CONFIGS, serialisePricing, parsePriceRangeText } from '@/lib/pricingModels';

describe('PRICING_CONFIGS coverage', () => {
  const expectedCategories = [
    'catering', 'mobile_toilets', 'cold_room_hire', 'tents', 'transport',
    'photographer', 'decor', 'livestock', 'makeup_beauty', 'attire_tailoring',
    'cakes_baking', 'invitations_stationery', 'drinks_ice_delivery', 'other',
  ];

  it('has entries for all 14 expected categories', () => {
    for (const cat of expectedCategories) {
      expect(PRICING_CONFIGS[cat as keyof typeof PRICING_CONFIGS]).toBeDefined();
    }
  });

  it('every config has required fields', () => {
    for (const cat of expectedCategories) {
      const config = PRICING_CONFIGS[cat as keyof typeof PRICING_CONFIGS]!;
      expect(config.model).toBeTruthy();
      expect(config.primaryLabel).toBeTruthy();
      expect(config.primaryPlaceholder).toBeTruthy();
      expect(typeof config.hasMinimum).toBe('boolean');
      expect(typeof config.hasMaximum).toBe('boolean');
      expect(config.exampleOutput).toBeTruthy();
    }
  });

  it('catering uses per_head model', () => {
    expect(PRICING_CONFIGS.catering!.model).toBe('per_head');
  });

  it('livestock uses per_animal model', () => {
    expect(PRICING_CONFIGS.livestock!.model).toBe('per_animal');
  });

  it('photographer uses per_event model', () => {
    expect(PRICING_CONFIGS.photographer!.model).toBe('per_event');
  });

  it('tents uses per_day model', () => {
    expect(PRICING_CONFIGS.tents!.model).toBe('per_day');
  });

  it('other uses starting_from model', () => {
    expect(PRICING_CONFIGS.other!.model).toBe('starting_from');
  });
});

describe('serialisePricing', () => {
  it('returns empty string for empty primary input', () => {
    expect(serialisePricing('catering', '', '', '')).toBe('');
  });

  it('returns empty string for unknown categories', () => {
    expect(serialisePricing('nonexistent', '100', '', '')).toBe('');
  });

  it('returns empty string for zero amount', () => {
    expect(serialisePricing('catering', '0', '', '')).toBe('');
  });

  it('formats catering per_head correctly', () => {
    const result = serialisePricing('catering', '150', '50', '');
    expect(result).toContain('R');
    expect(result).toContain('150');
    expect(result).toContain('/head');
    expect(result).toContain('min 50');
  });

  it('formats catering without minimum', () => {
    const result = serialisePricing('catering', '150', '', '');
    expect(result).toContain('From');
    expect(result).toContain('/head');
    expect(result).not.toContain('min');
  });

  it('formats livestock as Goat/Sheep format', () => {
    const result = serialisePricing('livestock', '2500', '', '12000');
    expect(result).toContain('Goat/Sheep from');
    expect(result).toContain('Cow from');
  });

  it('formats livestock without cow price', () => {
    const result = serialisePricing('livestock', '2500', '', '');
    expect(result).toContain('Goat/Sheep from');
    expect(result).not.toContain('Cow');
  });

  it('formats per_day with minimum', () => {
    const result = serialisePricing('cold_room_hire', '800', '1', '');
    expect(result).toContain('From');
    expect(result).toContain('/day');
    expect(result).toContain('min 1');
  });

  it('formats per_event with max range', () => {
    const result = serialisePricing('photographer', '5000', '', '15000');
    expect(result).toContain('From');
    expect(result).toContain('5');
    expect(result).toContain('15');
  });

  it('formats starting_from with max', () => {
    const result = serialisePricing('cakes_baking', '800', '', '5000');
    expect(result).toContain('From');
    expect(result).toContain('800');
  });

  it('formats starting_from without max', () => {
    const result = serialisePricing('other', '500', '', '');
    expect(result).toContain('From');
    expect(result).toContain('500');
  });

  it('strips non-numeric characters from primary', () => {
    const result = serialisePricing('catering', 'R1,500', '', '');
    expect(result).toContain('1');
    expect(result).toContain('500');
  });

  it('handles transport per_day', () => {
    const result = serialisePricing('transport', '1200', '', '5000');
    expect(result).toContain('From');
    expect(result).toContain('/trip');
  });

  it('handles mobile_toilets per_day', () => {
    const result = serialisePricing('mobile_toilets', '350', '1', '');
    expect(result).toContain('/unit/day');
  });

  it('handles tents per_day', () => {
    const result = serialisePricing('tents', '2500', '', '');
    expect(result).toContain('From');
    expect(result).toContain('/day');
  });

  it('handles decor per_event', () => {
    const result = serialisePricing('decor', '3000', '', '20000');
    expect(result).toContain('From');
  });

  it('handles invitations_stationery', () => {
    const result = serialisePricing('invitations_stationery', '25', '20', '');
    expect(result).toContain('From');
  });

  it('handles drinks_ice_delivery', () => {
    const result = serialisePricing('drinks_ice_delivery', '500', '', '');
    expect(result).toContain('From');
    expect(result).toContain('500');
  });

  it('handles makeup_beauty per_head', () => {
    const result = serialisePricing('makeup_beauty', '450', '1', '');
    expect(result).toContain('/person');
  });

  it('handles attire_tailoring starting_from', () => {
    const result = serialisePricing('attire_tailoring', '1200', '', '8000');
    expect(result).toContain('From');
  });
});

describe('parsePriceRangeText', () => {
  it('returns empty strings for null', () => {
    const result = parsePriceRangeText(null);
    expect(result).toEqual({ primary: '', minimum: '', maximum: '' });
  });

  it('returns empty strings for empty string', () => {
    const result = parsePriceRangeText('');
    expect(result).toEqual({ primary: '', minimum: '', maximum: '' });
  });

  it('extracts single R-prefixed amount', () => {
    const result = parsePriceRangeText('From R5,000');
    expect(result.primary).toBe('5000');
  });

  it('extracts two R-prefixed amounts', () => {
    const result = parsePriceRangeText('From R5,000 – R15,000');
    expect(result.primary).toBe('5000');
    expect(result.maximum).toBe('15000');
  });

  it('minimum is always empty from parser', () => {
    const result = parsePriceRangeText('From R150/head (min 50 guests)');
    expect(result.minimum).toBe('');
  });

  it('handles livestock format', () => {
    const result = parsePriceRangeText('Goat/Sheep from R2,500 · Cow from R12,000');
    expect(result.primary).toBe('2500');
    expect(result.maximum).toBe('12000');
  });
});
