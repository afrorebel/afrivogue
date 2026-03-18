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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      article_submissions: {
        Row: {
          admin_notes: string | null
          category: string
          content: string
          created_at: string
          id: string
          images: Json | null
          points_awarded: number | null
          status: string
          tags: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          category: string
          content: string
          created_at?: string
          id?: string
          images?: Json | null
          points_awarded?: number | null
          status?: string
          tags?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          content?: string
          created_at?: string
          id?: string
          images?: Json | null
          points_awarded?: number | null
          status?: string
          tags?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          trend_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          trend_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          trend_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_trend_id_fkey"
            columns: ["trend_id"]
            isOneToOne: false
            referencedRelation: "trends"
            referencedColumns: ["id"]
          },
        ]
      }
      forecasts: {
        Row: {
          created_at: string
          domain: string
          evidence: string
          horizon: string
          id: string
          implications: string
          projection: string
          published: boolean
          published_date: string
          region: string
          signal_strength: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain: string
          evidence: string
          horizon: string
          id?: string
          implications: string
          projection: string
          published?: boolean
          published_date?: string
          region: string
          signal_strength: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string
          evidence?: string
          horizon?: string
          id?: string
          implications?: string
          projection?: string
          published?: boolean
          published_date?: string
          region?: string
          signal_strength?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      moodboard_items: {
        Row: {
          approved: boolean
          caption: string
          category: string
          created_at: string
          id: string
          image_url: string
          related_trend_id: string | null
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          approved?: boolean
          caption?: string
          category: string
          created_at?: string
          id?: string
          image_url: string
          related_trend_id?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          approved?: boolean
          caption?: string
          category?: string
          created_at?: string
          id?: string
          image_url?: string
          related_trend_id?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moodboard_items_related_trend_id_fkey"
            columns: ["related_trend_id"]
            isOneToOne: false
            referencedRelation: "trends"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          source: string | null
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          source?: string | null
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          source?: string | null
          subscribed_at?: string
        }
        Relationships: []
      }
      points_history: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reading_history: {
        Row: {
          id: string
          read_at: string
          trend_id: string
          user_id: string
        }
        Insert: {
          id?: string
          read_at?: string
          trend_id: string
          user_id: string
        }
        Update: {
          id?: string
          read_at?: string
          trend_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_history_trend_id_fkey"
            columns: ["trend_id"]
            isOneToOne: false
            referencedRelation: "trends"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      saved_articles: {
        Row: {
          id: string
          saved_at: string
          trend_id: string
          user_id: string
        }
        Insert: {
          id?: string
          saved_at?: string
          trend_id: string
          user_id: string
        }
        Update: {
          id?: string
          saved_at?: string
          trend_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_articles_trend_id_fkey"
            columns: ["trend_id"]
            isOneToOne: false
            referencedRelation: "trends"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_moodboard_items: {
        Row: {
          id: string
          moodboard_item_id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          id?: string
          moodboard_item_id: string
          saved_at?: string
          user_id: string
        }
        Update: {
          id?: string
          moodboard_item_id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_moodboard_items_moodboard_item_id_fkey"
            columns: ["moodboard_item_id"]
            isOneToOne: false
            referencedRelation: "moodboard_items"
            referencedColumns: ["id"]
          },
        ]
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
      trends: {
        Row: {
          category: string
          content_tier: string
          created_at: string
          cultural_significance: string
          editorial_content: Json | null
          featured_image_url: string | null
          geo_relevance: string
          headline: string
          id: string
          image_hint: string | null
          images: Json | null
          members_only: boolean
          needs_review: boolean
          original_source_content: string | null
          published: boolean
          source_name: string | null
          source_url: string | null
          updated_at: string
          urgency: string
        }
        Insert: {
          category: string
          content_tier: string
          created_at?: string
          cultural_significance: string
          editorial_content?: Json | null
          featured_image_url?: string | null
          geo_relevance: string
          headline: string
          id?: string
          image_hint?: string | null
          images?: Json | null
          members_only?: boolean
          needs_review?: boolean
          original_source_content?: string | null
          published?: boolean
          source_name?: string | null
          source_url?: string | null
          updated_at?: string
          urgency: string
        }
        Update: {
          category?: string
          content_tier?: string
          created_at?: string
          cultural_significance?: string
          editorial_content?: Json | null
          featured_image_url?: string | null
          geo_relevance?: string
          headline?: string
          id?: string
          image_hint?: string | null
          images?: Json | null
          members_only?: boolean
          needs_review?: boolean
          original_source_content?: string | null
          published?: boolean
          source_name?: string | null
          source_url?: string | null
          updated_at?: string
          urgency?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          points: number
          total_earned: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          points?: number
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          points?: number
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          categories: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          categories?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          categories?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          created_at: string
          dollar_amount: number
          id: string
          points_amount: number
          processed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dollar_amount: number
          id?: string
          points_amount: number
          processed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dollar_amount?: number
          id?: string
          points_amount?: number
          processed_at?: string | null
          status?: string
          user_id?: string
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
