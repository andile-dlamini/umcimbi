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
        ]
      }
      events: {
        Row: {
          created_at: string | null
          date: string | null
          estimated_guest_count: number | null
          id: string
          location: string | null
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
          estimated_guest_count?: number | null
          id?: string
          location?: string | null
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
          estimated_guest_count?: number | null
          id?: string
          location?: string | null
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
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_type: Database["public"]["Enums"]["sender_type"]
          sender_user_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_type: Database["public"]["Enums"]["sender_type"]
          sender_user_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
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
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_profile_complete: boolean | null
          phone_number: string | null
          preferred_language:
            | Database["public"]["Enums"]["preferred_language"]
            | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_profile_complete?: boolean | null
          phone_number?: string | null
          preferred_language?:
            | Database["public"]["Enums"]["preferred_language"]
            | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_profile_complete?: boolean | null
          phone_number?: string | null
          preferred_language?:
            | Database["public"]["Enums"]["preferred_language"]
            | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          budget_range: string | null
          created_at: string
          event_date: string | null
          event_id: string
          guest_count: number | null
          id: string
          message: string | null
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
          guest_count?: number | null
          id?: string
          message?: string | null
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
          guest_count?: number | null
          id?: string
          message?: string | null
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
        ]
      }
      vendors: {
        Row: {
          about: string | null
          added_to_events_count: number | null
          category: Database["public"]["Enums"]["vendor_category"]
          created_at: string | null
          email: string | null
          id: string
          image_urls: string[] | null
          is_active: boolean | null
          languages: string[] | null
          location: string | null
          name: string
          owner_user_id: string | null
          phone_number: string | null
          price_range_text: string | null
          rating: number | null
          review_count: number | null
          updated_at: string | null
          view_count: number | null
          website_url: string | null
          whatsapp_number: string | null
        }
        Insert: {
          about?: string | null
          added_to_events_count?: number | null
          category?: Database["public"]["Enums"]["vendor_category"]
          created_at?: string | null
          email?: string | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          languages?: string[] | null
          location?: string | null
          name: string
          owner_user_id?: string | null
          phone_number?: string | null
          price_range_text?: string | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string | null
          view_count?: number | null
          website_url?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          about?: string | null
          added_to_events_count?: number | null
          category?: Database["public"]["Enums"]["vendor_category"]
          created_at?: string | null
          email?: string | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          languages?: string[] | null
          location?: string | null
          name?: string
          owner_user_id?: string | null
          phone_number?: string | null
          price_range_text?: string | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string | null
          view_count?: number | null
          website_url?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      preferred_language: "zulu" | "english"
      rsvp_status: "invited" | "yes" | "no" | "unknown"
      sender_type: "user" | "vendor" | "system"
      service_request_status:
        | "pending"
        | "quoted"
        | "accepted"
        | "declined"
        | "completed"
        | "cancelled"
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
      vendor_category:
        | "decor"
        | "catering"
        | "livestock"
        | "tents"
        | "transport"
        | "attire"
        | "photographer"
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
      preferred_language: ["zulu", "english"],
      rsvp_status: ["invited", "yes", "no", "unknown"],
      sender_type: ["user", "vendor", "system"],
      service_request_status: [
        "pending",
        "quoted",
        "accepted",
        "declined",
        "completed",
        "cancelled",
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
      vendor_category: [
        "decor",
        "catering",
        "livestock",
        "tents",
        "transport",
        "attire",
        "photographer",
        "other",
      ],
    },
  },
} as const
