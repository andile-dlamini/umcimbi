export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      booking_reviews: {
        Row: {
          booking_id: string
          comment: string | null
          communication_rating: number | null
          created_at: string
          id: string
          payment_rating: number | null
          rating: number
          reviewed_party_id: string
          reviewer_id: string
          reviewer_type: string
          service_rating: number | null
        }
        Insert: {
          booking_id: string
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          id?: string
          payment_rating?: number | null
          rating: number
          reviewed_party_id: string
          reviewer_id: string
          reviewer_type: string
          service_rating?: number | null
        }
        Update: {
          booking_id?: string
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          id?: string
          payment_rating?: number | null
          rating?: number
          reviewed_party_id?: string
          reviewer_id?: string
          reviewer_type?: string
          service_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          agreed_price: number
          balance_amount: number | null
          balance_due_at: string | null
          balance_paid_at: string | null
          balance_status: Database["public"]["Enums"]["payment_status"]
          booking_status: Database["public"]["Enums"]["booking_status"]
          client_id: string
          created_at: string
          deposit_amount: number | null
          deposit_due_at: string | null
          deposit_paid_at: string | null
          deposit_status: Database["public"]["Enums"]["payment_status"]
          event_date_time: string | null
          event_id: string
          id: string
          quote_id: string | null
          service_category: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          agreed_price: number
          balance_amount?: number | null
          balance_due_at?: string | null
          balance_paid_at?: string | null
          balance_status?: Database["public"]["Enums"]["payment_status"]
          booking_status?: Database["public"]["Enums"]["booking_status"]
          client_id: string
          created_at?: string
          deposit_amount?: number | null
          deposit_due_at?: string | null
          deposit_paid_at?: string | null
          deposit_status?: Database["public"]["Enums"]["payment_status"]
          event_date_time?: string | null
          event_id: string
          id?: string
          quote_id?: string | null
          service_category?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          agreed_price?: number
          balance_amount?: number | null
          balance_due_at?: string | null
          balance_paid_at?: string | null
          balance_status?: Database["public"]["Enums"]["payment_status"]
          booking_status?: Database["public"]["Enums"]["booking_status"]
          client_id?: string
          created_at?: string
          deposit_amount?: number | null
          deposit_due_at?: string | null
          deposit_paid_at?: string | null
          deposit_status?: Database["public"]["Enums"]["payment_status"]
          event_date_time?: string | null
          event_id?: string
          id?: string
          quote_id?: string | null
          service_category?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          actual_amount: number | null
          category: Database["public"]["Enums"]["budget_category"] | null
          created_at: string | null
          description: string
          event_id: string
          id: string
          is_paid: boolean | null
          planned_amount: number | null
          updated_at: string | null
        }
        Insert: {
          actual_amount?: number | null
          category?: Database["public"]["Enums"]["budget_category"] | null
          created_at?: string | null
          description: string
          event_id: string
          id?: string
          is_paid?: boolean | null
          planned_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_amount?: number | null
          category?: Database["public"]["Enums"]["budget_category"] | null
          created_at?: string | null
          description?: string
          event_id?: string
          id?: string
          is_paid?: boolean | null
          planned_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          last_message_at: string | null
          updated_at: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          last_message_at?: string | null
          updated_at?: string
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          last_message_at?: string | null
          updated_at?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_proofs: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          notes: string | null
          photos: string[] | null
          uploaded_by: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          notes?: string | null
          photos?: string[] | null
          uploaded_by: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          photos?: string[] | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_proofs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      event_vendors: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          role_or_note: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          role_or_note?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          role_or_note?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_vendors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_vendors_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_vendors_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          date: string | null
          estimated_budget: number | null
          estimated_guest_count: number | null
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          name: string
          notes: string | null
          owner_user_id: string
          size: string | null
          type: Database["public"]["Enums"]["event_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          estimated_budget?: number | null
          estimated_guest_count?: number | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name: string
          notes?: string | null
          owner_user_id: string
          size?: string | null
          type: Database["public"]["Enums"]["event_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          estimated_budget?: number | null
          estimated_guest_count?: number | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name?: string
          notes?: string | null
          owner_user_id?: string
          size?: string | null
          type?: Database["public"]["Enums"]["event_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      guests: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          name: string
          phone_number: string | null
          rsvp_status: Database["public"]["Enums"]["rsvp_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          name: string
          phone_number?: string | null
          rsvp_status?: Database["public"]["Enums"]["rsvp_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          name?: string
          phone_number?: string | null
          rsvp_status?: Database["public"]["Enums"]["rsvp_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json
          content: string
          conversation_id: string
          created_at: string
          id: string
          message_type: string
          metadata: Json | null
          read_at: string | null
          sender_type: Database["public"]["Enums"]["sender_type"]
          sender_user_id: string | null
        }
        Insert: {
          attachments?: Json
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          sender_type: Database["public"]["Enums"]["sender_type"]
          sender_user_id?: string | null
        }
        Update: {
          attachments?: Json
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          sender_type?: Database["public"]["Enums"]["sender_type"]
          sender_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_requests: {
        Row: {
          attempt_count: number
          created_at: string
          expires_at: string
          id: string
          last_sent_at: string
          max_attempts: number
          otp_hash: string
          phone_number: string
          send_count: number
          verified: boolean
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          expires_at: string
          id?: string
          last_sent_at?: string
          max_attempts?: number
          otp_hash: string
          phone_number: string
          send_count?: number
          verified?: boolean
        }
        Update: {
          attempt_count?: number
          created_at?: string
          expires_at?: string
          id?: string
          last_sent_at?: string
          max_attempts?: number
          otp_hash?: string
          phone_number?: string
          send_count?: number
          verified?: boolean
        }
        Relationships: []
      }
      payment_proofs: {
        Row: {
          amount_cents: number | null
          booking_id: string
          created_at: string
          id: string
          kind: string
          payer_user_id: string
          payment_method: string | null
          reference_text: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          storage_key: string
          yoco_checkout_id: string | null
          yoco_processed_at: string | null
        }
        Insert: {
          amount_cents?: number | null
          booking_id: string
          created_at?: string
          id?: string
          kind: string
          payer_user_id: string
          payment_method?: string | null
          reference_text?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_key: string
          yoco_checkout_id?: string | null
          yoco_processed_at?: string | null
        }
        Update: {
          amount_cents?: number | null
          booking_id?: string
          created_at?: string
          id?: string
          kind?: string
          payer_user_id?: string
          payment_method?: string | null
          reference_text?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_key?: string
          yoco_checkout_id?: string | null
          yoco_processed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          address_line_1: string | null
          address_line_2: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_profile_complete: boolean | null
          notifications_enabled: boolean | null
          phone_number: string | null
          phone_verified: boolean
          postal_code: string | null
          preferred_language:
            | Database["public"]["Enums"]["preferred_language"]
            | null
          state_province: string | null
          surname: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_profile_complete?: boolean | null
          notifications_enabled?: boolean | null
          phone_number?: string | null
          phone_verified?: boolean
          postal_code?: string | null
          preferred_language?:
            | Database["public"]["Enums"]["preferred_language"]
            | null
          state_province?: string | null
          surname?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_profile_complete?: boolean | null
          notifications_enabled?: boolean | null
          phone_number?: string | null
          phone_verified?: boolean
          postal_code?: string | null
          preferred_language?:
            | Database["public"]["Enums"]["preferred_language"]
            | null
          state_province?: string | null
          surname?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quote_line_items: {
        Row: {
          created_at: string
          description: string
          id: string
          quantity: number
          quote_id: string
          sort_order: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          quantity?: number
          quote_id: string
          sort_order?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          quantity?: number
          quote_id?: string
          sort_order?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          adjustment_count: number
          adjustment_reason: string | null
          created_at: string
          deposit_percentage: number
          expires_at: string | null
          final_offer_pdf_generated_at: string | null
          final_offer_pdf_key: string | null
          id: string
          notes: string | null
          offer_number: string | null
          price: number
          proposed_date_time_window: string | null
          request_id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["quote_status"]
          updated_at: string
          vendor_id: string
        }
        Insert: {
          adjustment_count?: number
          adjustment_reason?: string | null
          created_at?: string
          deposit_percentage?: number
          expires_at?: string | null
          final_offer_pdf_generated_at?: string | null
          final_offer_pdf_key?: string | null
          id?: string
          notes?: string | null
          offer_number?: string | null
          price: number
          proposed_date_time_window?: string | null
          request_id: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          updated_at?: string
          vendor_id: string
        }
        Update: {
          adjustment_count?: number
          adjustment_reason?: string | null
          created_at?: string
          deposit_percentage?: number
          expires_at?: string | null
          final_offer_pdf_generated_at?: string | null
          final_offer_pdf_key?: string | null
          id?: string
          notes?: string | null
          offer_number?: string | null
          price?: number
          proposed_date_time_window?: string | null
          request_id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          budget_range: string | null
          created_at: string
          event_date: string | null
          event_id: string
          expires_at: string | null
          guest_count: number | null
          id: string
          message: string | null
          origin: string
          quoted_amount: number | null
          requester_user_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["service_request_status"]
          updated_at: string
          vendor_id: string
          vendor_response: string | null
        }
        Insert: {
          budget_range?: string | null
          created_at?: string
          event_date?: string | null
          event_id: string
          expires_at?: string | null
          guest_count?: number | null
          id?: string
          message?: string | null
          origin?: string
          quoted_amount?: number | null
          requester_user_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["service_request_status"]
          updated_at?: string
          vendor_id: string
          vendor_response?: string | null
        }
        Update: {
          budget_range?: string | null
          created_at?: string
          event_date?: string | null
          event_id?: string
          expires_at?: string | null
          guest_count?: number | null
          id?: string
          message?: string | null
          origin?: string
          quoted_amount?: number | null
          requester_user_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["service_request_status"]
          updated_at?: string
          vendor_id?: string
          vendor_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_name: string | null
          category: Database["public"]["Enums"]["task_category"] | null
          completed: boolean | null
          created_at: string | null
          description: string | null
          due_date: string | null
          event_id: string
          id: string
          sort_order: number
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee_name?: string | null
          category?: Database["public"]["Enums"]["task_category"] | null
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          event_id: string
          id?: string
          sort_order?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          assignee_name?: string | null
          category?: Database["public"]["Enums"]["task_category"] | null
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          event_id?: string
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_reviews: {
        Row: {
          comment: string | null
          created_at: string
          event_id: string | null
          id: string
          rating: number
          updated_at: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          rating: number
          updated_at?: string
          user_id: string
          vendor_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_verification_documents: {
        Row: {
          created_at: string
          doc_type: Database["public"]["Enums"]["verification_doc_type"]
          file_url: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["verification_doc_status"]
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          doc_type: Database["public"]["Enums"]["verification_doc_type"]
          file_url: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["verification_doc_status"]
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          doc_type?: Database["public"]["Enums"]["verification_doc_type"]
          file_url?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["verification_doc_status"]
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_verification_documents_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_verification_documents_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          about: string | null
          added_to_events_count: number | null
          address_line_1: string | null
          address_line_2: string | null
          business_verification_status: Database["public"]["Enums"]["business_verification_status"]
          category: Database["public"]["Enums"]["vendor_category"]
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          image_urls: string[] | null
          is_active: boolean | null
          is_super_vendor: boolean
          jobs_completed: number
          languages: string[] | null
          latitude: number | null
          letterhead_enabled: boolean
          location: string | null
          logo_url: string | null
          longitude: number | null
          name: string
          owner_user_id: string | null
          phone_number: string | null
          postal_code: string | null
          price_range_text: string | null
          rating: number | null
          registered_business_name: string | null
          registration_number: string | null
          review_count: number | null
          show_registration_on_pdf: boolean
          show_vat_on_pdf: boolean
          state_province: string | null
          super_vendor_awarded_at: string | null
          super_vendor_reason: string | null
          updated_at: string | null
          vat_number: string | null
          vendor_business_type: Database["public"]["Enums"]["vendor_business_type"]
          verification_reviewed_at: string | null
          verification_reviewed_by: string | null
          view_count: number | null
          website_url: string | null
          whatsapp_number: string | null
        }
        Insert: {
          about?: string | null
          added_to_events_count?: number | null
          address_line_1?: string | null
          address_line_2?: string | null
          business_verification_status?: Database["public"]["Enums"]["business_verification_status"]
          category?: Database["public"]["Enums"]["vendor_category"]
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          is_super_vendor?: boolean
          jobs_completed?: number
          languages?: string[] | null
          latitude?: number | null
          letterhead_enabled?: boolean
          location?: string | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          owner_user_id?: string | null
          phone_number?: string | null
          postal_code?: string | null
          price_range_text?: string | null
          rating?: number | null
          registered_business_name?: string | null
          registration_number?: string | null
          review_count?: number | null
          show_registration_on_pdf?: boolean
          show_vat_on_pdf?: boolean
          state_province?: string | null
          super_vendor_awarded_at?: string | null
          super_vendor_reason?: string | null
          updated_at?: string | null
          vat_number?: string | null
          vendor_business_type?: Database["public"]["Enums"]["vendor_business_type"]
          verification_reviewed_at?: string | null
          verification_reviewed_by?: string | null
          view_count?: number | null
          website_url?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          about?: string | null
          added_to_events_count?: number | null
          address_line_1?: string | null
          address_line_2?: string | null
          business_verification_status?: Database["public"]["Enums"]["business_verification_status"]
          category?: Database["public"]["Enums"]["vendor_category"]
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          is_super_vendor?: boolean
          jobs_completed?: number
          languages?: string[] | null
          latitude?: number | null
          letterhead_enabled?: boolean
          location?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          owner_user_id?: string | null
          phone_number?: string | null
          postal_code?: string | null
          price_range_text?: string | null
          rating?: number | null
          registered_business_name?: string | null
          registration_number?: string | null
          review_count?: number | null
          show_registration_on_pdf?: boolean
          show_vat_on_pdf?: boolean
          state_province?: string | null
          super_vendor_awarded_at?: string | null
          super_vendor_reason?: string | null
          updated_at?: string | null
          vat_number?: string | null
          vendor_business_type?: Database["public"]["Enums"]["vendor_business_type"]
          verification_reviewed_at?: string | null
          verification_reviewed_by?: string | null
          view_count?: number | null
          website_url?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      vendors_public: {
        Row: {
          about: string | null
          added_to_events_count: number | null
          address_line_1: string | null
          address_line_2: string | null
          business_verification_status:
            | Database["public"]["Enums"]["business_verification_status"]
            | null
          category: Database["public"]["Enums"]["vendor_category"] | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          id: string | null
          image_urls: string[] | null
          is_active: boolean | null
          is_super_vendor: boolean | null
          languages: string[] | null
          latitude: number | null
          letterhead_enabled: boolean | null
          location: string | null
          logo_url: string | null
          longitude: number | null
          name: string | null
          owner_user_id: string | null
          phone_number: string | null
          postal_code: string | null
          price_range_text: string | null
          rating: number | null
          review_count: number | null
          show_registration_on_pdf: boolean | null
          show_vat_on_pdf: boolean | null
          state_province: string | null
          super_vendor_awarded_at: string | null
          super_vendor_reason: string | null
          updated_at: string | null
          vendor_business_type:
            | Database["public"]["Enums"]["vendor_business_type"]
            | null
          view_count: number | null
          website_url: string | null
          whatsapp_number: string | null
        }
        Insert: {
          about?: string | null
          added_to_events_count?: number | null
          address_line_1?: string | null
          address_line_2?: string | null
          business_verification_status?:
            | Database["public"]["Enums"]["business_verification_status"]
            | null
          category?: Database["public"]["Enums"]["vendor_category"] | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          image_urls?: string[] | null
          is_active?: boolean | null
          is_super_vendor?: boolean | null
          languages?: string[] | null
          latitude?: number | null
          letterhead_enabled?: boolean | null
          location?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string | null
          owner_user_id?: string | null
          phone_number?: string | null
          postal_code?: string | null
          price_range_text?: string | null
          rating?: number | null
          review_count?: number | null
          show_registration_on_pdf?: boolean | null
          show_vat_on_pdf?: boolean | null
          state_province?: string | null
          super_vendor_awarded_at?: string | null
          super_vendor_reason?: string | null
          updated_at?: string | null
          vendor_business_type?:
            | Database["public"]["Enums"]["vendor_business_type"]
            | null
          view_count?: number | null
          website_url?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          about?: string | null
          added_to_events_count?: number | null
          address_line_1?: string | null
          address_line_2?: string | null
          business_verification_status?:
            | Database["public"]["Enums"]["business_verification_status"]
            | null
          category?: Database["public"]["Enums"]["vendor_category"] | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          image_urls?: string[] | null
          is_active?: boolean | null
          is_super_vendor?: boolean | null
          languages?: string[] | null
          latitude?: number | null
          letterhead_enabled?: boolean | null
          location?: string | null
          logo_url?: string | null
          longitude?: number | null
          name?: string | null
          owner_user_id?: string | null
          phone_number?: string | null
          postal_code?: string | null
          price_range_text?: string | null
          rating?: number | null
          review_count?: number | null
          show_registration_on_pdf?: boolean | null
          show_vat_on_pdf?: boolean | null
          state_province?: string | null
          super_vendor_awarded_at?: string | null
          super_vendor_reason?: string | null
          updated_at?: string | null
          vendor_business_type?:
            | Database["public"]["Enums"]["vendor_business_type"]
            | null
          view_count?: number | null
          website_url?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_offer_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "vendor" | "admin"
      booking_status:
        | "pending_deposit"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "disputed"
      budget_category:
        | "gifts"
        | "decor"
        | "catering"
        | "livestock"
        | "transport"
        | "attire"
        | "venue"
        | "other"
        | "funeral_services"
        | "healer_services"
        | "music"
      business_verification_status:
        | "not_applicable"
        | "pending"
        | "verified"
        | "rejected"
      event_type:
        | "umembeso"
        | "umabo"
        | "imbeleko"
        | "family_introduction"
        | "lobola"
        | "umbondo"
        | "umemulo"
        | "funeral"
        | "ancestral_ritual"
      payment_status: "not_due" | "due" | "paid" | "pending_verification"
      preferred_language: "zulu" | "english"
      quote_status:
        | "pending_client"
        | "client_accepted"
        | "client_declined"
        | "expired"
        | "adjustment_requested"
      rsvp_status: "invited" | "yes" | "no" | "unknown"
      sender_type: "user" | "vendor" | "system"
      service_request_status:
        | "pending"
        | "quoted"
        | "accepted"
        | "declined"
        | "completed"
        | "cancelled"
        | "expired"
        | "vendor_declined"
      task_category:
        | "gifts"
        | "decor"
        | "livestock"
        | "transport"
        | "catering"
        | "attire"
        | "finance"
        | "venue"
        | "other"
      vendor_business_type: "independent" | "registered_business"
      vendor_category:
        | "decor"
        | "catering"
        | "livestock"
        | "tents"
        | "transport"
        | "attire"
        | "photographer"
        | "other"
        | "invitations_stationery"
        | "makeup_beauty"
        | "cold_room_hire"
        | "mobile_toilets"
        | "attire_tailoring"
        | "drinks_ice_delivery"
        | "cakes_baking"
      verification_doc_status: "uploaded" | "approved" | "rejected"
      verification_doc_type:
        | "cipc_registration"
        | "proof_of_address"
        | "bank_confirmation"
        | "vat_certificate"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "vendor", "admin"],
      booking_status: [
        "pending_deposit",
        "confirmed",
        "cancelled",
        "completed",
        "disputed",
      ],
      budget_category: [
        "gifts",
        "decor",
        "catering",
        "livestock",
        "transport",
        "attire",
        "venue",
        "other",
        "funeral_services",
        "healer_services",
        "music",
      ],
      business_verification_status: [
        "not_applicable",
        "pending",
        "verified",
        "rejected",
      ],
      event_type: [
        "umembeso",
        "umabo",
        "imbeleko",
        "family_introduction",
        "lobola",
        "umbondo",
        "umemulo",
        "funeral",
        "ancestral_ritual",
      ],
      payment_status: ["not_due", "due", "paid", "pending_verification"],
      preferred_language: ["zulu", "english"],
      quote_status: [
        "pending_client",
        "client_accepted",
        "client_declined",
        "expired",
        "adjustment_requested",
      ],
      rsvp_status: ["invited", "yes", "no", "unknown"],
      sender_type: ["user", "vendor", "system"],
      service_request_status: [
        "pending",
        "quoted",
        "accepted",
        "declined",
        "completed",
        "cancelled",
        "expired",
        "vendor_declined",
      ],
      task_category: [
        "gifts",
        "decor",
        "livestock",
        "transport",
        "catering",
        "attire",
        "finance",
        "venue",
        "other",
      ],
      vendor_business_type: ["independent", "registered_business"],
      vendor_category: [
        "decor",
        "catering",
        "livestock",
        "tents",
        "transport",
        "attire",
        "photographer",
        "other",
        "invitations_stationery",
        "makeup_beauty",
        "cold_room_hire",
        "mobile_toilets",
        "attire_tailoring",
        "drinks_ice_delivery",
        "cakes_baking",
      ],
      verification_doc_status: ["uploaded", "approved", "rejected"],
      verification_doc_type: [
        "cipc_registration",
        "proof_of_address",
        "bank_confirmation",
        "vat_certificate",
        "other",
      ],
    },
  },
} as const
