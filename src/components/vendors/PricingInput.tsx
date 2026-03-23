import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PRICING_CONFIGS, serialisePricing, parsePriceRangeText } from '@/lib/pricingModels';
import type { VendorCategory } from '@/lib/vendorCategories';

interface PricingInputProps {
  category: string;
  value: string;
  onChange: (formatted: string) => void;
}

export function PricingInput({ category, value, onChange }: PricingInputProps) {
  const config = PRICING_CONFIGS[category as VendorCategory];

  const parsed = parsePriceRangeText(value);
  const [primary, setPrimary] = useState(parsed.primary);
  const [minimum, setMinimum] = useState(parsed.minimum);
  const [maximum, setMaximum] = useState(parsed.maximum);

  // Re-parse when value changes externally (e.g. edit mode load)
  useEffect(() => {
    const p = parsePriceRangeText(value);
    setPrimary(p.primary);
    setMinimum(p.minimum);
    setMaximum(p.maximum);
  }, [value]);

  // If no config (no category selected), show plain input
  if (!config) {
    return (
      <div className="space-y-2">
        <Label>Price range</Label>
        <Input
          placeholder="e.g., From R5,000 or R150/head"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12"
        />
      </div>
    );
  }

  const handleChange = (
    newPrimary: string,
    newMinimum: string,
    newMaximum: string
  ) => {
    const serialised = serialisePricing(category, newPrimary, newMinimum, newMaximum);
    onChange(serialised);
  };

  const preview = serialisePricing(category, primary, minimum, maximum);

  return (
    <div className="space-y-3">
      {/* Primary price */}
      <div className="space-y-2">
        <Label>{config.primaryLabel}</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            R
          </span>
          <Input
            type="number"
            min="0"
            placeholder={config.primaryPlaceholder}
            value={primary}
            onChange={(e) => {
              const v = e.target.value;
              setPrimary(v);
              handleChange(v, minimum, maximum);
            }}
            className="h-12 pl-8"
          />
        </div>
      </div>

      {/* Minimum field */}
      {config.hasMinimum && config.minimumLabel && (
        <div className="space-y-2">
          <Label>{config.minimumLabel}</Label>
          <Input
            type="number"
            min="0"
            placeholder={config.minimumPlaceholder}
            value={minimum}
            onChange={(e) => {
              const v = e.target.value;
              setMinimum(v);
              handleChange(primary, v, maximum);
            }}
            className="h-12"
          />
        </div>
      )}

      {/* Maximum field */}
      {config.hasMaximum && config.maximumLabel && (
        <div className="space-y-2">
          <Label>{config.maximumLabel}</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
              R
            </span>
            <Input
              type="number"
              min="0"
              placeholder={config.maximumPlaceholder}
              value={maximum}
              onChange={(e) => {
                const v = e.target.value;
                setMaximum(v);
                handleChange(primary, minimum, v);
              }}
              className="h-12 pl-8"
            />
          </div>
        </div>
      )}

      {/* Live preview */}
      <div className="rounded-lg bg-muted/50 border border-border p-3">
        <p className="text-xs text-muted-foreground mb-1">Clients will see:</p>
        <p className="text-sm font-medium text-primary">
          {preview || (
            <span className="text-muted-foreground font-normal italic">
              {config.exampleOutput}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
