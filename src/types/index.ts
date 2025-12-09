export type EventType = 'umembeso' | 'umabo';

export type EventSize = 'small' | 'medium' | 'large';

export interface Event {
  id: string;
  name: string;
  type: EventType;
  date: string | null;
  location: string;
  estimatedGuestCount: number;
  size: EventSize;
  notes: string;
  createdAt: string;
  selectedVendorIds: string[];
}

export interface Task {
  id: string;
  eventId: string;
  title: string;
  description: string;
  category: TaskCategory;
  dueDate: string | null;
  completed: boolean;
  assigneeName: string;
}

export type TaskCategory = 
  | 'gifts'
  | 'decor'
  | 'livestock'
  | 'transport'
  | 'catering'
  | 'attire'
  | 'finance'
  | 'venue'
  | 'other';

export interface BudgetItem {
  id: string;
  eventId: string;
  category: BudgetCategory;
  description: string;
  plannedAmount: number;
  actualAmount: number;
  isPaid: boolean;
}

export type BudgetCategory =
  | 'gifts'
  | 'decor'
  | 'catering'
  | 'livestock'
  | 'transport'
  | 'attire'
  | 'venue'
  | 'other';

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  location: string;
  about: string;
  priceRangeText: string;
  rating: number;
  reviewCount: number;
  phoneNumber: string;
  whatsappLink: string;
  imageUrls: string[];
}

export type VendorCategory =
  | 'decor'
  | 'catering'
  | 'livestock'
  | 'tents'
  | 'photography'
  | 'attire'
  | 'transport'
  | 'other';

export interface Guest {
  id: string;
  eventId: string;
  name: string;
  phoneNumber: string;
  rsvpStatus: 'invited' | 'yes' | 'no' | 'unknown';
}

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  isGuest: boolean;
  language: 'en' | 'zu';
}

export interface AppState {
  user: User | null;
  events: Event[];
  tasks: Task[];
  budgetItems: BudgetItem[];
  guests: Guest[];
  isOnboarded: boolean;
}