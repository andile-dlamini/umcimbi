// Centralized vendor category definitions and helpers

export type VendorCategory = 
  | 'decor' 
  | 'catering' 
  | 'livestock' 
  | 'tents' 
  | 'transport' 
  | 'attire' 
  | 'photographer' 
  | 'other'
  | 'invitations_stationery'
  | 'makeup_beauty'
  | 'cold_room_hire'
  | 'mobile_toilets'
  | 'attire_tailoring'
  | 'drinks_ice_delivery';

export interface VendorCategoryInfo {
  value: VendorCategory;
  label: string;
}

// All vendor categories with human-readable labels
export const VENDOR_CATEGORIES: VendorCategoryInfo[] = [
  { value: 'decor', label: 'Decor & Styling' },
  { value: 'catering', label: 'Catering' },
  { value: 'livestock', label: 'Livestock / Abattoir' },
  { value: 'tents', label: 'Tents & Stretch Tents' },
  { value: 'transport', label: 'Transport' },
  { value: 'attire', label: 'Attire' },
  { value: 'photographer', label: 'Photographer / Videographer' },
  { value: 'invitations_stationery', label: 'Invitations & Stationery' },
  { value: 'makeup_beauty', label: 'Bridal Makeup & Beauty' },
  { value: 'cold_room_hire', label: 'Cold Room Hire' },
  { value: 'mobile_toilets', label: 'Mobile Toilets & Sanitation' },
  { value: 'attire_tailoring', label: 'Attire & Tailoring' },
  { value: 'drinks_ice_delivery', label: 'Drinks & Ice Delivery' },
  { value: 'other', label: 'Other Services' },
];

// Map for quick label lookup
export const VENDOR_CATEGORY_LABELS: Record<VendorCategory, string> = 
  VENDOR_CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = cat.label;
    return acc;
  }, {} as Record<VendorCategory, string>);

// Get label for a category, with fallback
export function getVendorCategoryLabel(category: string): string {
  return VENDOR_CATEGORY_LABELS[category as VendorCategory] || category;
}

// Categories for filter dropdowns (includes "all" option)
export const VENDOR_CATEGORY_FILTER_OPTIONS: { value: VendorCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  ...VENDOR_CATEGORIES,
];

// Zod-compatible enum values for validation
export const VENDOR_CATEGORY_VALUES = VENDOR_CATEGORIES.map(c => c.value) as [VendorCategory, ...VendorCategory[]];
