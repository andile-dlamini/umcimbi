import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRIES } from '@/data/countries';

export interface AddressData {
  address_line_1: string;
  address_line_2: string;
  city: string;
  state_province: string;
  country: string;
  postal_code: string;
}

interface AddressFieldsProps {
  data: AddressData;
  onChange: (data: AddressData) => void;
  errors?: Record<string, string>;
}

export function AddressFields({ data, onChange, errors }: AddressFieldsProps) {
  const update = (field: keyof AddressData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="address_line_1">Address Line 1 *</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="address_line_1"
            placeholder="Street address"
            value={data.address_line_1}
            onChange={(e) => update('address_line_1', e.target.value)}
            className={`pl-10 h-12 ${errors?.address_line_1 ? 'border-destructive' : ''}`}
          />
        </div>
        {errors?.address_line_1 && <p className="text-sm text-destructive">{errors.address_line_1}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address_line_2">Address Line 2</Label>
        <Input
          id="address_line_2"
          placeholder="Apartment, suite, unit, etc. (optional)"
          value={data.address_line_2}
          onChange={(e) => update('address_line_2', e.target.value)}
          className="h-12"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="city">City / Suburb *</Label>
          <Input
            id="city"
            placeholder="e.g., Durban"
            value={data.city}
            onChange={(e) => update('city', e.target.value)}
            className={`h-12 ${errors?.city ? 'border-destructive' : ''}`}
          />
          {errors?.city && <p className="text-sm text-destructive">{errors.city}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state_province">State / Province</Label>
          <Input
            id="state_province"
            placeholder="e.g., KwaZulu-Natal"
            value={data.state_province}
            onChange={(e) => update('state_province', e.target.value)}
            className="h-12"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Country *</Label>
          <Select
            value={data.country}
            onValueChange={(v) => update('country', v)}
          >
            <SelectTrigger className={`h-12 ${errors?.country ? 'border-destructive' : ''}`}>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.country && <p className="text-sm text-destructive">{errors.country}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="postal_code">Postal / Zip Code *</Label>
          <Input
            id="postal_code"
            placeholder="e.g., 4001"
            value={data.postal_code}
            onChange={(e) => update('postal_code', e.target.value)}
            className={`h-12 ${errors?.postal_code ? 'border-destructive' : ''}`}
          />
          {errors?.postal_code && <p className="text-sm text-destructive">{errors.postal_code}</p>}
        </div>
      </div>
    </div>
  );
}
