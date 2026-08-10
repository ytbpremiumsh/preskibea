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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      ai_behavior: {
        Row: {
          created_at: string
          enabled: boolean
          fallback_message: string
          id: string
          language: string
          max_tokens: number
          model: string
          persona_name: string
          system_prompt: string
          temperature: number
          tone: string
          updated_at: string
          wa_auto_reply: boolean
          wa_webhook_token: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          fallback_message?: string
          id?: string
          language?: string
          max_tokens?: number
          model?: string
          persona_name?: string
          system_prompt?: string
          temperature?: number
          tone?: string
          updated_at?: string
          wa_auto_reply?: boolean
          wa_webhook_token?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          fallback_message?: string
          id?: string
          language?: string
          max_tokens?: number
          model?: string
          persona_name?: string
          system_prompt?: string
          temperature?: number
          tone?: string
          updated_at?: string
          wa_auto_reply?: boolean
          wa_webhook_token?: string | null
        }
        Relationships: []
      }
      ai_knowledge_base: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          enabled: boolean
          id: string
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ai_provider_settings: {
        Row: {
          api_key: string | null
          base_url: string | null
          created_at: string
          enabled: boolean
          id: string
          model: string
          updated_at: string
          vendor: string
        }
        Insert: {
          api_key?: string | null
          base_url?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          model?: string
          updated_at?: string
          vendor?: string
        }
        Update: {
          api_key?: string | null
          base_url?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          model?: string
          updated_at?: string
          vendor?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          author: string | null
          category: string
          content: string
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          category?: string
          content?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          category?: string
          content?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          doc_key: string | null
          doc_type: string
          email: string
          email_key: string | null
          extra: Json
          file_url: string
          id: string
          kind: Database["public"]["Enums"]["scholarship_kind"]
          registration_id: string | null
          review_status: Database["public"]["Enums"]["doc_review_status"]
          reviewed_at: string | null
        }
        Insert: {
          created_at?: string
          doc_key?: string | null
          doc_type: string
          email: string
          email_key?: string | null
          extra?: Json
          file_url: string
          id?: string
          kind: Database["public"]["Enums"]["scholarship_kind"]
          registration_id?: string | null
          review_status?: Database["public"]["Enums"]["doc_review_status"]
          reviewed_at?: string | null
        }
        Update: {
          created_at?: string
          doc_key?: string | null
          doc_type?: string
          email?: string
          email_key?: string | null
          extra?: Json
          file_url?: string
          id?: string
          kind?: Database["public"]["Enums"]["scholarship_kind"]
          registration_id?: string | null
          review_status?: Database["public"]["Enums"]["doc_review_status"]
          reviewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          created_at: string
          email: string
          id: string
          mayar_invoice_id: string | null
          mayar_link: string | null
          name: string
          paid_at: string | null
          registration_id: string | null
          status: Database["public"]["Enums"]["donation_status"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          email: string
          id?: string
          mayar_invoice_id?: string | null
          mayar_link?: string | null
          name: string
          paid_at?: string | null
          registration_id?: string | null
          status?: Database["public"]["Enums"]["donation_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          email?: string
          id?: string
          mayar_invoice_id?: string | null
          mayar_link?: string | null
          name?: string
          paid_at?: string | null
          registration_id?: string | null
          status?: Database["public"]["Enums"]["donation_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          external_id: string | null
          id: string
          payment_url: string | null
          registration_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          external_id?: string | null
          id?: string
          payment_url?: string | null
          registration_id: string
          status: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          external_id?: string | null
          id?: string
          payment_url?: string | null
          registration_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          address: string
          birth_date: string
          birth_place: string
          candidate_reviewed_at: string | null
          candidate_status: Database["public"]["Enums"]["candidate_status"]
          created_at: string
          dependents: number | null
          education_level: string
          email: string
          extra: Json
          fast_track: boolean | null
          full_name: string
          gender: string
          grade: string
          id: string
          kind: Database["public"]["Enums"]["scholarship_kind"]
          main_achievement: string | null
          parent_income: string | null
          payment_status: string | null
          payment_url: string | null
          photo_url: string | null
          school_name: string
          status: Database["public"]["Enums"]["registration_status"]
          student_card_url: string | null
          token: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          address: string
          birth_date: string
          birth_place: string
          candidate_reviewed_at?: string | null
          candidate_status?: Database["public"]["Enums"]["candidate_status"]
          created_at?: string
          dependents?: number | null
          education_level: string
          email: string
          extra?: Json
          fast_track?: boolean | null
          full_name: string
          gender: string
          grade: string
          id?: string
          kind: Database["public"]["Enums"]["scholarship_kind"]
          main_achievement?: string | null
          parent_income?: string | null
          payment_status?: string | null
          payment_url?: string | null
          photo_url?: string | null
          school_name: string
          status?: Database["public"]["Enums"]["registration_status"]
          student_card_url?: string | null
          token: string
          updated_at?: string
          whatsapp: string
        }
        Update: {
          address?: string
          birth_date?: string
          birth_place?: string
          candidate_reviewed_at?: string | null
          candidate_status?: Database["public"]["Enums"]["candidate_status"]
          created_at?: string
          dependents?: number | null
          education_level?: string
          email?: string
          extra?: Json
          fast_track?: boolean | null
          full_name?: string
          gender?: string
          grade?: string
          id?: string
          kind?: Database["public"]["Enums"]["scholarship_kind"]
          main_achievement?: string | null
          parent_income?: string | null
          payment_status?: string | null
          payment_url?: string | null
          photo_url?: string | null
          school_name?: string
          status?: Database["public"]["Enums"]["registration_status"]
          student_card_url?: string | null
          token?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      system_updates: {
        Row: {
          branch: string
          commit_hash: string | null
          commit_message: string | null
          created_at: string
          duration_ms: number | null
          id: string
          log_output: string | null
          status: Database["public"]["Enums"]["update_status"]
          trigger_source: Database["public"]["Enums"]["update_trigger_source"]
          triggered_by: string | null
          updated_at: string
        }
        Insert: {
          branch?: string
          commit_hash?: string | null
          commit_message?: string | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          log_output?: string | null
          status?: Database["public"]["Enums"]["update_status"]
          trigger_source: Database["public"]["Enums"]["update_trigger_source"]
          triggered_by?: string | null
          updated_at?: string
        }
        Update: {
          branch?: string
          commit_hash?: string | null
          commit_message?: string | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          log_output?: string | null
          status?: Database["public"]["Enums"]["update_status"]
          trigger_source?: Database["public"]["Enums"]["update_trigger_source"]
          triggered_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wa_chat_messages: {
        Row: {
          ai_used: boolean
          contact_name: string | null
          created_at: string
          direction: string
          id: string
          matched_kb_id: string | null
          message: string
          phone: string
          raw: Json | null
          status: string
        }
        Insert: {
          ai_used?: boolean
          contact_name?: string | null
          created_at?: string
          direction: string
          id?: string
          matched_kb_id?: string | null
          message: string
          phone: string
          raw?: Json | null
          status?: string
        }
        Update: {
          ai_used?: boolean
          contact_name?: string | null
          created_at?: string
          direction?: string
          id?: string
          matched_kb_id?: string | null
          message?: string
          phone?: string
          raw?: Json | null
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_registration_token: { Args: { p_kind: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      candidate_status: "pending" | "approved" | "rejected"
      doc_review_status: "pending" | "approved" | "rejected"
      donation_status: "pending" | "paid" | "failed" | "expired"
      registration_status: "pending" | "verified" | "approved" | "rejected"
      scholarship_kind: "prestasi" | "ekonomi" | "umum" | "yatim"
      update_status: "running" | "success" | "failed"
      update_trigger_source: "manual" | "webhook" | "rollback"
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
      app_role: ["admin", "moderator", "user"],
      candidate_status: ["pending", "approved", "rejected"],
      doc_review_status: ["pending", "approved", "rejected"],
      donation_status: ["pending", "paid", "failed", "expired"],
      registration_status: ["pending", "verified", "approved", "rejected"],
      scholarship_kind: ["prestasi", "ekonomi", "umum", "yatim"],
      update_status: ["running", "success", "failed"],
      update_trigger_source: ["manual", "webhook", "rollback"],
    },
  },
} as const
