export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      book_clubs: {
        Row: {
          access_tier_required: string | null
          created_at: string | null
          description: string | null
          id: string
          lead_user_id: string
          name: string
          privacy: string | null
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          access_tier_required?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          lead_user_id: string
          name: string
          privacy?: string | null
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          access_tier_required?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          lead_user_id?: string
          name?: string
          privacy?: string | null
          store_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_clubs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      book_likes: {
        Row: {
          created_at: string | null
          nomination_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          nomination_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          nomination_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_likes_nomination_id_fkey"
            columns: ["nomination_id"]
            isOneToOne: false
            referencedRelation: "book_nominations"
            referencedColumns: ["id"]
          },
        ]
      }
      book_nominations: {
        Row: {
          book_id: string | null
          club_id: string | null
          id: string
          nominated_at: string | null
          nominated_by: string | null
          status: string | null
        }
        Insert: {
          book_id?: string | null
          club_id?: string | null
          id?: string
          nominated_at?: string | null
          nominated_by?: string | null
          status?: string | null
        }
        Update: {
          book_id?: string | null
          club_id?: string | null
          id?: string
          nominated_at?: string | null
          nominated_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_nominations_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_nominations_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "book_clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author: string
          cover_url: string | null
          created_at: string | null
          description: string | null
          genre: string | null
          google_books_id: string | null
          id: string
          title: string
        }
        Insert: {
          author: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          google_books_id?: string | null
          id?: string
          title: string
        }
        Update: {
          author?: string
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          genre?: string | null
          google_books_id?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          book_id: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          message: string
          reply_to_id: string | null
          timestamp: string
          user_id: string | null
          username: string
        }
        Insert: {
          book_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          message: string
          reply_to_id?: string | null
          timestamp: string
          user_id?: string | null
          username: string
        }
        Update: {
          book_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          message?: string
          reply_to_id?: string | null
          timestamp?: string
          user_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      club_members: {
        Row: {
          club_id: string
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          club_id: string
          joined_at?: string | null
          role: string
          user_id: string
        }
        Update: {
          club_id?: string
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "book_clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_moderators: {
        Row: {
          assigned_at: string | null
          assigned_by_user_id: string | null
          club_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by_user_id?: string | null
          club_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by_user_id?: string | null
          club_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_moderators_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "book_clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      current_books: {
        Row: {
          author: string
          book_id: string | null
          club_id: string
          nomination_id: string | null
          set_at: string | null
          title: string
        }
        Insert: {
          author: string
          book_id?: string | null
          club_id: string
          nomination_id?: string | null
          set_at?: string | null
          title: string
        }
        Update: {
          author?: string
          book_id?: string | null
          club_id?: string
          nomination_id?: string | null
          set_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "current_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "current_books_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: true
            referencedRelation: "book_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "current_books_nomination_id_fkey"
            columns: ["nomination_id"]
            isOneToOne: false
            referencedRelation: "book_nominations"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_posts: {
        Row: {
          content: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_moderator: boolean | null
          id: string
          is_deleted: boolean | null
          parent_post_id: string | null
          topic_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_moderator?: boolean | null
          id?: string
          is_deleted?: boolean | null
          parent_post_id?: string | null
          topic_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_moderator?: boolean | null
          id?: string
          is_deleted?: boolean | null
          parent_post_id?: string | null
          topic_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discussion_posts_parent_post_id_fkey"
            columns: ["parent_post_id"]
            isOneToOne: false
            referencedRelation: "discussion_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_posts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "discussion_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_topics: {
        Row: {
          club_id: string | null
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          club_id?: string | null
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          club_id?: string | null
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discussion_topics_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "book_clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      event_notifications: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          is_read: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_read?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_read?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          event_id: string
          rsvp_at: string | null
          rsvp_status: string | null
          user_id: string
        }
        Insert: {
          event_id: string
          rsvp_at?: string | null
          rsvp_status?: string | null
          user_id: string
        }
        Update: {
          event_id?: string
          rsvp_at?: string | null
          rsvp_status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          club_id: string | null
          created_at: string | null
          created_by: string | null
          date: string
          description: string
          end_time: string | null
          event_type: string | null
          featured_on_landing: boolean | null
          id: string
          image_alt_text: string | null
          image_metadata: Json | null
          image_url: string | null
          is_virtual: boolean | null
          location: string | null
          max_participants: number | null
          medium_url: string | null
          start_time: string | null
          store_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          virtual_meeting_link: string | null
        }
        Insert: {
          club_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          description: string
          end_time?: string | null
          event_type?: string | null
          featured_on_landing?: boolean | null
          id?: string
          image_alt_text?: string | null
          image_metadata?: Json | null
          image_url?: string | null
          is_virtual?: boolean | null
          location?: string | null
          max_participants?: number | null
          medium_url?: string | null
          start_time?: string | null
          store_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          virtual_meeting_link?: string | null
        }
        Update: {
          club_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string
          end_time?: string | null
          event_type?: string | null
          featured_on_landing?: boolean | null
          id?: string
          image_alt_text?: string | null
          image_metadata?: Json | null
          image_url?: string | null
          is_virtual?: boolean | null
          location?: string | null
          max_participants?: number | null
          medium_url?: string | null
          start_time?: string | null
          store_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          virtual_meeting_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "book_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          id: string
          message_id: string
          reaction: string
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: string
          reaction: string
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string
          reaction?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_records: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          payment_reference: string | null
          recorded_by: string
          store_id: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          payment_reference?: string | null
          recorded_by: string
          store_id: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          payment_reference?: string | null
          recorded_by?: string
          store_id?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          created_at: string | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      post_reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          reaction_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          reaction_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          reaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "discussion_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      private_chats: {
        Row: {
          created_at: string | null
          id: string
          receiver_id: string
          requester_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          receiver_id: string
          requester_id: string
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          receiver_id?: string
          requester_id?: string
          status?: string
        }
        Relationships: []
      }
      role_activity: {
        Row: {
          context_id: string
          context_type: string | null
          created_at: string | null
          last_active: string | null
          role_type: string
          user_id: string
        }
        Insert: {
          context_id?: string
          context_type?: string | null
          created_at?: string | null
          last_active?: string | null
          role_type: string
          user_id: string
        }
        Update: {
          context_id?: string
          context_type?: string | null
          created_at?: string | null
          last_active?: string | null
          role_type?: string
          user_id?: string
        }
        Relationships: []
      }
      store_administrators: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          role: string
          store_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          role: string
          store_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          role?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_administrators_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          start_date: string
          store_id: string
          subscription_type: string
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          start_date?: string
          store_id: string
          subscription_type: string
          tier: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          start_date?: string
          store_id?: string
          subscription_type?: string
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reporter_username: string
          target_type: string
          target_id: string | null
          target_user_id: string | null
          target_username: string | null
          reason: string
          description: string
          severity: string
          club_id: string | null
          store_id: string | null
          status: string
          priority: number
          resolved_by: string | null
          resolved_at: string | null
          resolution_action: string | null
          resolution_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reporter_username: string
          target_type: string
          target_id?: string | null
          target_user_id?: string | null
          target_username?: string | null
          reason: string
          description: string
          severity: string
          club_id?: string | null
          store_id?: string | null
          status?: string
          priority?: number
          resolved_by?: string | null
          resolved_at?: string | null
          resolution_action?: string | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          reporter_username?: string
          target_type?: string
          target_id?: string | null
          target_user_id?: string | null
          target_username?: string | null
          reason?: string
          description?: string
          severity?: string
          club_id?: string | null
          store_id?: string | null
          status?: string
          priority?: number
          resolved_by?: string | null
          resolved_at?: string | null
          resolution_action?: string | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          account_tier: string
          allow_chats: boolean | null
          bio: string | null
          created_at: string | null
          displayname: string | null
          email: string
          favorite_author: string | null
          favorite_genre: string | null
          id: string
          membership_tier: string
          username: string | null
        }
        Insert: {
          account_tier?: string
          allow_chats?: boolean | null
          bio?: string | null
          created_at?: string | null
          displayname?: string | null
          email: string
          favorite_author?: string | null
          favorite_genre?: string | null
          id: string
          membership_tier?: string
          username?: string | null
        }
        Update: {
          account_tier?: string
          allow_chats?: boolean | null
          bio?: string | null
          created_at?: string | null
          displayname?: string | null
          email?: string
          favorite_author?: string | null
          favorite_genre?: string | null
          id?: string
          membership_tier?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_subscription_end_date: {
        Args: { start_date: string; subscription_type: string }
        Returns: string
      }
      can_moderate_content: {
        Args: { club_id: string }
        Returns: boolean
      }
      create_subscription_with_payment: {
        Args: {
          p_user_id: string
          p_store_id: string
          p_tier: string
          p_subscription_type: string
          p_recorded_by: string
          p_amount?: number
          p_payment_reference?: string
          p_notes?: string
        }
        Returns: string
      }
      get_active_subscription: {
        Args: { user_id: string }
        Returns: {
          auto_renew: boolean
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          start_date: string
          store_id: string
          subscription_type: string
          tier: string
          updated_at: string
          user_id: string
        }[]
      }
      has_account_tier: {
        Args: { required_tier: string }
        Returns: boolean
      }
      has_active_subscription: {
        Args: { user_id: string }
        Returns: boolean
      }
      has_membership_tier_or_higher: {
        Args: { user_id: string; required_tier: string }
        Returns: boolean
      }
      is_club_lead: {
        Args: { club_id: string }
        Returns: boolean
      }
      is_club_member: {
        Args: { club_id: string }
        Returns: boolean
      }
      is_club_moderator: {
        Args: { club_id: string }
        Returns: boolean
      }
      is_platform_owner: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_store_administrator: {
        Args: { store_id: string; required_role?: string }
        Returns: boolean
      }
      update_role_activity: {
        Args: {
          p_user_id: string
          p_role_type: string
          p_context_id?: string
          p_context_type?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
