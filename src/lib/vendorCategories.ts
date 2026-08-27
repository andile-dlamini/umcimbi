// Centralized vendor category definitions and helpers

export type VendorCategory = 
  | 'attire'
  | 'attire_tailoring'
  | 'cakes_baking'
  | 'catering' 
  | 'cleaning_services'
  | 'cold_room_hire'
  | 'decor'
  | 'dj_sound_audio'
  | 'drinks_ice_delivery'
  | 'event_planning'
  | 'florist'
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
  { value: 'cleaning_services', label: 'Cleaning Services' },
  { value: 'cold_room_hire', label: 'Cold Room Hire' },
  { value: 'decor', label: 'Decor & Styling' },
  { value: 'dj_sound_audio', label: 'DJ / Sound & Audio' },
  { value: 'drinks_ice_delivery', label: 'Drinks & Ice Delivery' },
  { value: 'event_planning', label: 'Event Planning' },
  { value: 'florist', label: 'Florist' },
  { value: 'invitations_stationery', label: 'Invitations, Stationery & Printing' },
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

export interface VendorWithCategories {
  category: string;
  additional_categories?: string[] | null;
}

export function vendorHasCategory(vendor: VendorWithCategories, category: string): boolean {
  return vendor.category === category || (vendor.additional_categories ?? []).includes(category);
}

export function formatVendorCategories(vendor: VendorWithCategories): string {
  const all = [vendor.category, ...(vendor.additional_categories ?? [])].filter(Boolean);
  const labels = all.map((c) => getVendorCategoryLabel(c));
  return labels.join(' · ');
}

export function truncateVendorCategories(vendor: VendorWithCategories, max = 2): { text: string; more: number } {
  const all = [vendor.category, ...(vendor.additional_categories ?? [])].filter(Boolean);
  const labels = all.map((c) => getVendorCategoryLabel(c));
  if (labels.length <= max) return { text: labels.join(' · '), more: 0 };
  return { text: labels.slice(0, max).join(' · '), more: labels.length - max };
}

// Categories for filter dropdowns (includes "all" option)
export const VENDOR_CATEGORY_FILTER_OPTIONS: { value: VendorCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  ...VENDOR_CATEGORIES,
];

// Zod-compatible enum values for validation
export const VENDOR_CATEGORY_VALUES = VENDOR_CATEGORIES.map(c => c.value) as [VendorCategory, ...VendorCategory[]];

// Categories hidden from discovery, browse, search, and new signup pickers.
// Existing vendors in these categories keep their data and stay bookable via
// existing chats/bookings — they just don't appear as choices anywhere new.
export const HIDDEN_VENDOR_CATEGORIES: VendorCategory[] = [
  'cakes_baking',
  'cleaning_services',
  'drinks_ice_delivery',
  'florist',
  'invitations_stationery',
  'makeup_beauty',
  'transport',
];

export const LIVE_VENDOR_CATEGORIES = VENDOR_CATEGORIES.filter(
  c => !HIDDEN_VENDOR_CATEGORIES.includes(c.value)
);

export const LIVE_VENDOR_CATEGORY_VALUES = LIVE_VENDOR_CATEGORIES.map(c => c.value) as [VendorCategory, ...VendorCategory[]];

export const LIVE_VENDOR_CATEGORY_FILTER_OPTIONS: { value: VendorCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  ...LIVE_VENDOR_CATEGORIES,
];
