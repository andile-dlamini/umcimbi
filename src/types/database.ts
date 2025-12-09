// Database types matching Supabase schema
export type AppRole = 'user' | 'vendor' | 'admin';
export type PreferredLanguage = 'zulu' | 'english';
export type EventType = 'umembeso' | 'umabo';
export type VendorCategory = 'decor' | 'catering' | 'livestock' | 'tents' | 'transport' | 'attire' | 'photographer' | 'other';
export type TaskCategory = 'gifts' | 'decor' | 'livestock' | 'transport' | 'catering' | 'attire' | 'finance' | 'venue' | 'other';
export type BudgetCategory = 'gifts' | 'decor' | 'catering' | 'livestock' | 'transport' | 'attire' | 'venue' | 'other';
export type RsvpStatus = 'invited' | 'yes' | 'no' | 'unknown';
export type SenderType = 'user' | 'vendor' | 'system';

export interface Profile {
  id: string;
  user_id: string;
  phone_number: string | null;
  full_name: string | null;
  email: string | null;
  preferred_language: PreferredLanguage;
  is_profile_complete: boolean;
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
  estimated_guest_count: number;
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
  created_at: string;
  read_at: string | null;
}

// Extended types with joined data
export interface ConversationWithDetails extends Conversation {
  vendor?: Vendor;
  event?: Event;
  user_profile?: Profile;
  last_message?: Message;
  unread_count?: number;
}

// Form types for creating/updating
export type CreateVendor = Omit<Vendor, 'id' | 'created_at' | 'updated_at' | 'rating' | 'review_count' | 'view_count' | 'added_to_events_count'>;
export type CreateEvent = Omit<Event, 'id' | 'created_at' | 'updated_at'>;
export type CreateTask = Omit<Task, 'id' | 'created_at' | 'updated_at'>;
export type CreateBudgetItem = Omit<BudgetItem, 'id' | 'created_at' | 'updated_at'>;
export type CreateGuest = Omit<Guest, 'id' | 'created_at' | 'updated_at'>;
export type CreateConversation = Omit<Conversation, 'id' | 'created_at' | 'updated_at' | 'last_message_at'>;
export type CreateMessage = Omit<Message, 'id' | 'created_at' | 'read_at'>;
