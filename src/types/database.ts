// Database types matching Supabase schema
export type AppRole = 'user' | 'vendor' | 'admin';
export type PreferredLanguage = 'zulu' | 'english';
export type EventType = 'umembeso' | 'umabo' | 'imbeleko' | 'family_introduction' | 'lobola' | 'umbondo' | 'umemulo' | 'funeral' | 'ancestral_ritual';
export type VendorCategory = 'attire' | 'attire_tailoring' | 'cakes_baking' | 'catering' | 'cold_room_hire' | 'decor' | 'drinks_ice_delivery' | 'invitations_stationery' | 'livestock' | 'makeup_beauty' | 'mobile_toilets' | 'other' | 'photographer' | 'tents' | 'transport';
export type TaskCategory = 'gifts' | 'decor' | 'livestock' | 'transport' | 'catering' | 'attire' | 'finance' | 'venue' | 'other';
export type BudgetCategory = 'gifts' | 'decor' | 'catering' | 'livestock' | 'transport' | 'attire' | 'venue' | 'funeral_services' | 'healer_services' | 'music' | 'other';
export type RsvpStatus = 'invited' | 'yes' | 'no' | 'unknown';
export type SenderType = 'user' | 'vendor' | 'system';
export type ServiceRequestStatus = 'pending' | 'quoted' | 'accepted' | 'declined' | 'completed' | 'cancelled' | 'expired' | 'vendor_declined';
export type ServiceRequestOrigin = 'client_initiated' | 'vendor_initiated';
export type VendorBusinessType = 'independent' | 'registered_business';
export type BusinessVerificationStatus = 'not_applicable' | 'pending' | 'verified' | 'rejected';
export type VerificationDocType = 'cipc_registration' | 'proof_of_address' | 'bank_confirmation' | 'vat_certificate' | 'other';
export type VerificationDocStatus = 'uploaded' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  user_id: string;
  phone_number: string | null;
  phone_verified: boolean;
  full_name: string | null;
  first_name: string | null;
  surname: string | null;
  address: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state_province: string | null;
  country: string | null;
  postal_code: string | null;
  email: string | null;
  preferred_language: PreferredLanguage;
  is_profile_complete: boolean;
  avatar_url: string | null;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Vendor {
  id: string;
  owner_user_id: string | null;
  name: string;
  category: VendorCategory;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state_province: string | null;
  country: string | null;
  postal_code: string | null;
  about: string | null;
  price_range_text: string | null;
  whatsapp_number: string | null;
  phone_number: string | null;
  email: string | null;
  website_url: string | null;
  languages: string[];
  rating: number;
  review_count: number;
  view_count: number;
  added_to_events_count: number;
  is_active: boolean;
  image_urls: string[];
  vendor_business_type: VendorBusinessType;
  business_verification_status: BusinessVerificationStatus;
  registered_business_name: string | null;
  registration_number: string | null;
  vat_number: string | null;
  is_super_vendor: boolean;
  super_vendor_awarded_at: string | null;
  super_vendor_reason: string | null;
  verification_reviewed_at: string | null;
  verification_reviewed_by: string | null;
  logo_url: string | null;
  letterhead_enabled: boolean;
  show_registration_on_pdf: boolean;
  show_vat_on_pdf: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorVerificationDocument {
  id: string;
  vendor_id: string;
  doc_type: VerificationDocType;
  file_url: string;
  status: VerificationDocStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  owner_user_id: string;
  name: string;
  type: EventType;
  date: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  estimated_guest_count: number;
  estimated_budget: number;
  size: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventVendor {
  id: string;
  event_id: string;
  vendor_id: string;
  role_or_note: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  due_date: string | null;
  completed: boolean;
  assignee_name: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetItem {
  id: string;
  event_id: string;
  category: BudgetCategory;
  description: string;
  planned_amount: number;
  actual_amount: number;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface Guest {
  id: string;
  event_id: string;
  name: string;
  phone_number: string | null;
  rsvp_status: RsvpStatus;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  vendor_id: string;
  event_id: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: SenderType;
  sender_user_id: string | null;
  content: string;
  message_type: string;
  attachments: any;
  metadata: any | null;
  created_at: string;
  read_at: string | null;
}

export interface ServiceRequest {
  id: string;
  event_id: string;
  vendor_id: string;
  requester_user_id: string;
  status: ServiceRequestStatus;
  origin: ServiceRequestOrigin;
  message: string | null;
  event_date: string | null;
  guest_count: number | null;
  budget_range: string | null;
  vendor_response: string | null;
  quoted_amount: number | null;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
}

// Extended types with joined data
export interface ConversationWithDetails extends Conversation {
  vendor?: Vendor;
  event?: Event;
  user_profile?: Profile;
  last_message?: Message;
  unread_count?: number;
  booking_status?: string | null;
  quote_status?: string | null;
}

export interface ServiceRequestWithDetails extends ServiceRequest {
  event?: Event;
  vendor?: Vendor;
  requester_profile?: Profile;
}

// Event type metadata for UI
export interface EventTypeInfo {
  id: EventType;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
}

export const EVENT_TYPES: EventTypeInfo[] = [
  { id: 'imbeleko', label: 'Imbeleko (Child / Ancestor Introduction)', shortLabel: 'Imbeleko', description: 'Child or ancestor introduction ceremony', icon: 'Baby' },
  { id: 'family_introduction', label: 'Family Introduction (Ukucela / Ukumisa isizwe)', shortLabel: 'Family Introduction', description: 'Meeting between families', icon: 'Users' },
  { id: 'lobola', label: 'Lobola Negotiation', shortLabel: 'Lobola', description: 'Bridewealth negotiation ceremony', icon: 'Handshake' },
  { id: 'umembeso', label: 'Umembeso (Gift-Giving Ceremony)', shortLabel: 'Umembeso', description: 'Gift-giving ceremony to honor the bride\'s family', icon: 'Gift' },
  { id: 'umbondo', label: 'Umbondo (Return Gifts)', shortLabel: 'Umbondo', description: 'Return gifts from bride\'s family', icon: 'Package' },
  { id: 'umabo', label: 'Traditional Wedding (Umabo)', shortLabel: 'Umabo', description: 'Traditional Zulu wedding ceremony', icon: 'Heart' },
  { id: 'umemulo', label: 'Umemulo (Coming-of-Age Ceremony)', shortLabel: 'Umemulo', description: 'Coming-of-age celebration', icon: 'Sparkles' },
  { id: 'funeral', label: 'Funeral (Umngcwabo)', shortLabel: 'Funeral', description: 'Traditional funeral arrangements', icon: 'Flower2' },
  { id: 'ancestral_ritual', label: 'Ancestral Ritual / Cleansing / Consultation', shortLabel: 'Ancestral Ritual', description: 'Spiritual rituals and cleansing', icon: 'Flame' },
];

export const getEventTypeInfo = (type: EventType): EventTypeInfo => {
  return EVENT_TYPES.find(t => t.id === type) || EVENT_TYPES[0];
};

// Form types for creating/updating
export type CreateVendor = Omit<Vendor, 'id' | 'created_at' | 'updated_at' | 'rating' | 'review_count' | 'view_count' | 'added_to_events_count' | 'latitude' | 'longitude' | 'is_super_vendor' | 'super_vendor_awarded_at' | 'super_vendor_reason' | 'verification_reviewed_at' | 'verification_reviewed_by' | 'logo_url' | 'show_registration_on_pdf' | 'show_vat_on_pdf' | 'letterhead_enabled'> & { logo_url?: string | null; show_registration_on_pdf?: boolean; show_vat_on_pdf?: boolean; letterhead_enabled?: boolean; };
export type CreateEvent = Omit<Event, 'id' | 'created_at' | 'updated_at' | 'latitude' | 'longitude' | 'estimated_budget'>;
export type CreateTask = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'sort_order'>;
export type CreateBudgetItem = Omit<BudgetItem, 'id' | 'created_at' | 'updated_at'>;
export type CreateGuest = Omit<Guest, 'id' | 'created_at' | 'updated_at'>;
export type CreateConversation = Omit<Conversation, 'id' | 'created_at' | 'updated_at' | 'last_message_at'>;
export type CreateMessage = Omit<Message, 'id' | 'created_at' | 'read_at'>;
export type CreateServiceRequest = Omit<ServiceRequest, 'id' | 'created_at' | 'updated_at' | 'responded_at' | 'vendor_response' | 'quoted_amount' | 'status' | 'origin'>;