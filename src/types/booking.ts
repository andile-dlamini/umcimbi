// Quote and Booking types

export type QuoteStatus = 'pending_client' | 'client_accepted' | 'client_declined' | 'expired';
export type BookingStatus = 'pending_deposit' | 'confirmed' | 'cancelled' | 'completed' | 'disputed';
export type PaymentStatus = 'not_due' | 'due' | 'paid';

export interface Quote {
  id: string;
  request_id: string;
  vendor_id: string;
  price: number;
  notes: string | null;
  proposed_date_time_window: string | null;
  status: QuoteStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteWithDetails extends Quote {
  vendor?: {
    id: string;
    name: string;
    category: string;
    rating: number | null;
    image_urls: string[] | null;
  };
  request?: {
    id: string;
    event_id: string;
    message: string | null;
    event_date: string | null;
  };
}

export interface Booking {
  id: string;
  event_id: string;
  client_id: string;
  vendor_id: string;
  quote_id: string | null;
  service_category: string | null;
  agreed_price: number;
  event_date_time: string | null;
  deposit_amount: number;
  balance_amount: number;
  booking_status: BookingStatus;
  deposit_status: PaymentStatus;
  balance_status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Booking {
  vendor?: {
    id: string;
    name: string;
    category: string;
    rating: number | null;
    image_urls: string[] | null;
    phone_number: string | null;
    whatsapp_number: string | null;
  };
  event?: {
    id: string;
    name: string;
    date: string | null;
    location: string | null;
  };
}

export interface DeliveryProof {
  id: string;
  booking_id: string;
  uploaded_by: string;
  photos: string[];
  notes: string | null;
  created_at: string;
}

export interface BookingReview {
  id: string;
  booking_id: string;
  reviewer_type: 'client' | 'vendor';
  reviewer_id: string;
  reviewed_party_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface CreateQuote {
  request_id: string;
  vendor_id: string;
  price: number;
  notes?: string;
  proposed_date_time_window?: string;
}

export interface CreateBooking {
  event_id: string;
  client_id: string;
  vendor_id: string;
  quote_id?: string;
  service_category?: string;
  agreed_price: number;
  event_date_time?: string;
  deposit_amount?: number;
  balance_amount?: number;
}
