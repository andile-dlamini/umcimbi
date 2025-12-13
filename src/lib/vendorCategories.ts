// Centralized vendor category definitions and helpers

export type VendorCategory = 
  | 'attire'
  | 'attire_tailoring'
  | 'cakes_baking'
  | 'catering' 
  | 'cold_room_hire'
  | 'decor' 
  | 'drinks_ice_delivery'
  | 'invitations_stationery'
  | 'livestock' 
  | 'makeup_beauty'
  | 'mobile_toilets'
  | 'other'
  | 'photographer' 
  | 'tents' 
  | 'transport';

export interface VendorCategoryInfo {
  value: VendorCategory;
  label: string;
}

// All vendor categories with human-readable labels (alphabetically sorted)
export const VENDOR_CATEGORIES: VendorCategoryInfo[] = [
  { value: 'attire_tailoring', label: 'Attire & Tailoring' },
  { value: 'cakes_baking', label: 'Cakes & Baking' },
  { value: 'catering', label: 'Catering' },
  { value: 'cold_room_hire', label: 'Cold Room Hire' },
  { value: 'decor', label: 'Decor & Styling' },
  { value: 'drinks_ice_delivery', label: 'Drinks & Ice Delivery' },
  { value: 'invitations_stationery', label: 'Invitations & Stationery' },
  { value: 'livestock', label: 'Livestock / Abattoir' },
  { value: 'makeup_beauty', label: 'Makeup & Beauty' },
  { value: 'mobile_toilets', label: 'Mobile Toilets & Sanitation' },
  { value: 'photographer', label: 'Photographer / Videographer' },
  { value: 'tents', label: 'Tents & Stretch Tents' },
  { value: 'transport', label: 'Transport' },
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
