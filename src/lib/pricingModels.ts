import type { VendorCategory } from './vendorCategories';

export type PricingModel =
  | 'per_head'
  | 'per_day'
  | 'per_event'
  | 'per_animal'
  | 'starting_from';

export interface PricingConfig {
  model: PricingModel;
  primaryLabel: string;
  primaryPlaceholder: string;
  primarySuffix: string;
  hasMinimum: boolean;
  minimumLabel?: string;
  minimumPlaceholder?: string;
  hasMaximum: boolean;
  maximumLabel?: string;
  maximumPlaceholder?: string;
  unit: string;
  exampleOutput: string;
}

export const PRICING_CONFIGS: Partial<Record<VendorCategory, PricingConfig>> = {
  catering: {
    model: 'per_head',
    primaryLabel: 'Price per head (R)',
    primaryPlaceholder: '150',
    primarySuffix: '/head',
    hasMinimum: true,
    minimumLabel: 'Minimum guests',
    minimumPlaceholder: '50',
    hasMaximum: true,
    maximumLabel: 'Maximum guests',
    maximumPlaceholder: '500',
    unit: 'head',
    exampleOutput: 'From R150/head (50–500 guests)',
  },
  mobile_toilets: {
    model: 'per_day',
    primaryLabel: 'Price per unit per day (R)',
    primaryPlaceholder: '350',
    primarySuffix: '/unit/day',
    hasMinimum: true,
    minimumLabel: 'Minimum rental days',
    minimumPlaceholder: '1',
    hasMaximum: false,
    unit: 'unit/day',
    exampleOutput: 'From R350/unit per day (min 1 day)',
  },
  cold_room_hire: {
    model: 'per_day',
    primaryLabel: 'Price per day (R)',
    primaryPlaceholder: '800',
    primarySuffix: '/day',
    hasMinimum: true,
    minimumLabel: 'Minimum rental days',
    minimumPlaceholder: '1',
    hasMaximum: false,
    unit: 'day',
    exampleOutput: 'From R800/day (min 1 day)',
  },
  tents: {
    model: 'per_day',
    primaryLabel: 'Starting price per day (R)',
    primaryPlaceholder: '2500',
    primarySuffix: '/day',
    hasMinimum: false,
    hasMaximum: true,
    maximumLabel: 'Maximum daily rate (R)',
    maximumPlaceholder: '8000',
    unit: 'day',
    exampleOutput: 'From R2,500/day',
  },
  transport: {
    model: 'per_day',
    primaryLabel: 'Starting price per trip (R)',
    primaryPlaceholder: '1200',
    primarySuffix: '/trip',
    hasMinimum: false,
    hasMaximum: true,
    maximumLabel: 'Maximum price per trip (R)',
    maximumPlaceholder: '5000',
    unit: 'trip',
    exampleOutput: 'From R1,200/trip',
  },
  photographer: {
    model: 'per_event',
    primaryLabel: 'Starting price per event (R)',
    primaryPlaceholder: '5000',
    primarySuffix: '',
    hasMinimum: false,
    hasMaximum: true,
    maximumLabel: 'Maximum price per event (R)',
    maximumPlaceholder: '15000',
    unit: 'event',
    exampleOutput: 'From R5,000 per event',
  },
  decor: {
    model: 'per_event',
    primaryLabel: 'Starting price (R)',
    primaryPlaceholder: '3000',
    primarySuffix: '',
    hasMinimum: false,
    hasMaximum: true,
    maximumLabel: 'Maximum price (R)',
    maximumPlaceholder: '20000',
    unit: 'event',
    exampleOutput: 'From R3,000',
  },
  livestock: {
    model: 'per_animal',
    primaryLabel: 'Price per goat/sheep (R)',
    primaryPlaceholder: '2500',
    primarySuffix: '/animal',
    hasMinimum: false,
    hasMaximum: true,
    maximumLabel: 'Price per cow (R)',
    maximumPlaceholder: '12000',
    unit: 'animal',
    exampleOutput: 'Goat/Sheep from R2,500 · Cow from R12,000',
  },
  makeup_beauty: {
    model: 'per_head',
    primaryLabel: 'Price per person (R)',
    primaryPlaceholder: '450',
    primarySuffix: '/person',
    hasMinimum: true,
    minimumLabel: 'Minimum persons',
    minimumPlaceholder: '1',
    hasMaximum: false,
    unit: 'person',
    exampleOutput: 'From R450/person',
  },
  attire_tailoring: {
    model: 'starting_from',
    primaryLabel: 'Starting price (R)',
    primaryPlaceholder: '1200',
    primarySuffix: '',
    hasMinimum: false,
    hasMaximum: true,
    maximumLabel: 'Maximum price (R)',
    maximumPlaceholder: '8000',
    unit: '',
    exampleOutput: 'From R1,200',
  },
  cakes_baking: {
    model: 'starting_from',
    primaryLabel: 'Starting price (R)',
    primaryPlaceholder: '800',
    primarySuffix: '',
    hasMinimum: false,
    hasMaximum: true,
    maximumLabel: 'Maximum price (R)',
    maximumPlaceholder: '5000',
    unit: '',
    exampleOutput: 'From R800',
  },
  invitations_stationery: {
    model: 'per_event',
    primaryLabel: 'Price per invitation (R)',
    primaryPlaceholder: '25',
    primarySuffix: '/invite',
    hasMinimum: true,
    minimumLabel: 'Minimum order quantity',
    minimumPlaceholder: '20',
    hasMaximum: false,
    unit: 'invite',
    exampleOutput: 'From R25/invite (min order 20)',
  },
  drinks_ice_delivery: {
    model: 'starting_from',
    primaryLabel: 'Starting price per delivery (R)',
    primaryPlaceholder: '500',
    primarySuffix: '',
    hasMinimum: false,
    hasMaximum: false,
    unit: 'delivery',
    exampleOutput: 'From R500 per delivery',
  },
  other: {
    model: 'starting_from',
    primaryLabel: 'Starting price (R)',
    primaryPlaceholder: '500',
    primarySuffix: '',
    hasMinimum: false,
    hasMaximum: false,
    unit: '',
    exampleOutput: 'From R500',
  },
};

export function serialisePricing(
  category: string,
  primary: string,
  minimum: string,
  maximum: string
): string {
  const config = PRICING_CONFIGS[category as VendorCategory];
  if (!config || !primary) return '';

  const amount = Number(primary.replace(/[^0-9]/g, ''));
  if (!amount) return '';

  const formatted = 'R' + amount.toLocaleString('en-ZA');

  switch (config.model) {
    case 'per_head': {
      const min = minimum ? ` (min ${minimum} ${config.unit}s)` : '';
      return `From ${formatted}${config.primarySuffix}${min}`;
    }
    case 'per_day': {
      const min = minimum ? ` (min ${minimum} ${config.unit})` : '';
      return `From ${formatted}${config.primarySuffix}${min}`;
    }
    case 'per_event': {
      const max = maximum
        ? ` – R${Number(maximum).toLocaleString('en-ZA')}`
        : '';
      return `From ${formatted}${max}`;
    }
    case 'per_animal': {
      if (category === 'livestock') {
        const cowPrice = maximum
          ? ` · Cow from R${Number(maximum).toLocaleString('en-ZA')}`
          : '';
        return `Goat/Sheep from ${formatted}${cowPrice}`;
      }
      return `From ${formatted}${config.primarySuffix}`;
    }
    case 'starting_from': {
      const max = maximum
        ? ` – R${Number(maximum).toLocaleString('en-ZA')}`
        : '';
      return `From ${formatted}${max}`;
    }
    default:
      return `From ${formatted}`;
  }
}

export function parsePriceRangeText(text: string | null): {
  primary: string;
  minimum: string;
  maximum: string;
} {
  if (!text) return { primary: '', minimum: '', maximum: '' };
  const amounts =
    text.match(/R[\d,]+/g)?.map((s) => s.replace(/[R,]/g, '')) || [];
  return {
    primary: amounts[0] || '',
    minimum: '',
    maximum: amounts[1] || '',
  };
}
