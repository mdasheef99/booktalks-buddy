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
          is_exclusive: boolean | null
          is_premium: boolean | null
          lead_user_id: string
          name: string
          privacy: string | null
          progress_tracking_enabled: boolean | null
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          access_tier_required?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_exclusive?: boolean | null
          is_premium?: boolean | null
          lead_user_id: string
          name: string
          privacy?: string | null
          progress_tracking_enabled?: boolean | null
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          access_tier_required?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_exclusive?: boolean | null
          is_premium?: boolean | null
          lead_user_id?: string
          name?: string
          privacy?: string | null
          progress_tracking_enabled?: boolean | null
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
      club_analytics_snapshots: {
        Row: {
          active_members_week: number | null
          club_id: string
          created_at: string | null
          current_book_progress: number | null
          discussion_count: number | null
          id: string
          meeting_attendance_rate: number | null
          meetings_this_month: number | null
          member_count: number | null
          new_members_month: number | null
          posts_count: number | null
          posts_this_week: number | null
          reading_completion_rate: number | null
          snapshot_date: string
          updated_at: string | null
        }
        Insert: {
          active_members_week?: number | null
          club_id: string
          created_at?: string | null
          current_book_progress?: number | null
          discussion_count?: number | null
          id?: string
          meeting_attendance_rate?: number | null
          meetings_this_month?: number | null
          member_count?: number | null
          new_members_month?: number | null
          posts_count?: number | null
          posts_this_week?: number | null
          reading_completion_rate?: number | null
          snapshot_date: string
          updated_at?: string | null
        }
        Update: {
          active_members_week?: number | null
          club_id?: string
          created_at?: string | null
          current_book_progress?: number | null
          discussion_count?: number | null
          id?: string
          meeting_attendance_rate?: number | null
          meetings_this_month?: number | null
          member_count?: number | null
          new_members_month?: number | null
          posts_count?: number | null
          posts_this_week?: number | null
          reading_completion_rate?: number | null
          snapshot_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_analytics_snapshots_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "book_clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_event_notifications: {
        Row: {
          club_id: string
          created_at: string | null
          dismissed_at: string | null
          id: string
          is_dismissed: boolean | null
          meeting_id: string | null
          message: string | null
          notification_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          club_id: string
          created_at?: string | null
          dismissed_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          meeting_id?: string | null
          message?: string | null
          notification_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          club_id?: string
          created_at?: string | null
          dismissed_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          meeting_id?: string | null
          message?: string | null
          notification_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_event_notifications_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "book_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_event_notifications_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "club_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      club_meeting_rsvps: {
        Row: {
          club_id: string
          id: string
          meeting_id: string
          rsvp_at: string | null
          rsvp_status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          meeting_id: string
          rsvp_at?: string | null
          rsvp_status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          meeting_id?: string
          rsvp_at?: string | null
          rsvp_status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_meeting_rsvps_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "book_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_meeting_rsvps_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "club_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      club_meetings: {
        Row: {
          club_id: string
          created_at: string | null
          created_by: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_recurring: boolean | null
          max_attendees: number | null
          meeting_type: string | null
          recurrence_pattern: Json | null
          scheduled_at: string
          title: string
          updated_at: string | null
          virtual_link: string | null
        }
        Insert: {
          club_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_recurring?: boolean | null
          max_attendees?: number | null
          meeting_type?: string | null
          recurrence_pattern?: Json | null
          scheduled_at: string
          title: string
          updated_at?: string | null
          virtual_link?: string | null
        }
        Update: {
          club_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_recurring?: boolean | null
          max_attendees?: number | null
          meeting_type?: string | null
          recurrence_pattern?: Json | null
          scheduled_at?: string
          title?: string
          updated_at?: string | null
          virtual_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_meetings_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "book_clubs"
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
          analytics_access: boolean | null
          appointed_at: string | null
          appointed_by: string | null
          assigned_at: string | null
          assigned_by_user_id: string | null
          club_id: string
          content_moderation_access: boolean | null
          customization_access: boolean | null
          is_active: boolean | null
          meeting_management_access: boolean | null
          member_management_access: boolean | null
          role: string | null
          user_id: string
        }
        Insert: {
          analytics_access?: boolean | null
          appointed_at?: string | null
          appointed_by?: string | null
          assigned_at?: string | null
          assigned_by_user_id?: string | null
          club_id: string
          content_moderation_access?: boolean | null
          customization_access?: boolean | null
          is_active?: boolean | null
          meeting_management_access?: boolean | null
          member_management_access?: boolean | null
          role?: string | null
          user_id: string
        }
        Update: {
          analytics_access?: boolean | null
          appointed_at?: string | null
          appointed_by?: string | null
          assigned_at?: string | null
          assigned_by_user_id?: string | null
          club_id?: string
          content_moderation_access?: boolean | null
          customization_access?: boolean | null
          is_active?: boolean | null
          meeting_management_access?: boolean | null
          member_management_access?: boolean | null
          role?: string | null
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
      conversation_participants: {
        Row: {
          conversation_id: string
          joined_at: string | null
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          store_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          store_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
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
      direct_messages: {
        Row: {
          content: string
          conversation_id: string | null
          deleted_at: string | null
          id: string
          is_deleted: boolean | null
          reply_to_id: string | null
          retention_expires_at: string | null
          sender_id: string | null
          sent_at: string | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          reply_to_id?: string | null
          retention_expires_at?: string | null
          sender_id?: string | null
          sent_at?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          reply_to_id?: string | null
          retention_expires_at?: string | null
          sender_id?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
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
      member_reading_progress: {
        Row: {
          book_id: string | null
          club_id: string
          created_at: string
          current_progress: number | null
          finished_at: string | null
          id: string
          is_private: boolean
          last_updated: string
          notes: string | null
          progress_percentage: number | null
          progress_type: "percentage" | "chapter" | "page" | null
          started_at: string | null
          status: "not_started" | "reading" | "finished"
          total_progress: number | null
          user_id: string
        }
        Insert: {
          book_id?: string | null
          club_id: string
          created_at?: string
          current_progress?: number | null
          finished_at?: string | null
          id?: string
          is_private?: boolean
          last_updated?: string
          notes?: string | null
          progress_percentage?: number | null
          progress_type?: "percentage" | "chapter" | "page" | null
          started_at?: string | null
          status?: "not_started" | "reading" | "finished"
          total_progress?: number | null
          user_id: string
        }
        Update: {
          book_id?: string | null
          club_id?: string
          created_at?: string
          current_progress?: number | null
          finished_at?: string | null
          id?: string
          is_private?: boolean
          last_updated?: string
          notes?: string | null
          progress_percentage?: number | null
          progress_type?: "percentage" | "chapter" | "page" | null
          started_at?: string | null
          status?: "not_started" | "reading" | "finished"
          total_progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_reading_progress_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_reading_progress_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "book_clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action_type: string
          club_id: string | null
          created_at: string | null
          duration_hours: number | null
          expires_at: string | null
          id: string
          moderator_id: string
          moderator_role: string
          moderator_username: string
          reason: string
          related_report_id: string | null
          revoked_at: string | null
          revoked_by: string | null
          revoked_reason: string | null
          severity: string
          status: string
          store_id: string | null
          target_id: string
          target_type: string
          target_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          action_type: string
          club_id?: string | null
          created_at?: string | null
          duration_hours?: number | null
          expires_at?: string | null
          id?: string
          moderator_id: string
          moderator_role: string
          moderator_username: string
          reason: string
          related_report_id?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          severity: string
          status?: string
          store_id?: string | null
          target_id: string
          target_type: string
          target_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          club_id?: string | null
          created_at?: string | null
          duration_hours?: number | null
          expires_at?: string | null
          id?: string
          moderator_id?: string
          moderator_role?: string
          moderator_username?: string
          reason?: string
          related_report_id?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          severity?: string
          status?: string
          store_id?: string | null
          target_id?: string
          target_type?: string
          target_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "book_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_related_report_id_fkey"
            columns: ["related_report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
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
      report_evidence: {
        Row: {
          created_at: string | null
          description: string | null
          evidence_data: Json
          evidence_type: string
          id: string
          report_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          evidence_data: Json
          evidence_type: string
          id?: string
          report_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          evidence_data?: Json
          evidence_type?: string
          id?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_evidence_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          club_id: string | null
          created_at: string | null
          description: string
          id: string
          priority: number | null
          reason: string
          reporter_id: string
          reporter_username: string
          resolution_action: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          store_id: string | null
          target_id: string | null
          target_type: string
          target_user_id: string | null
          target_username: string | null
          updated_at: string | null
        }
        Insert: {
          club_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          priority?: number | null
          reason: string
          reporter_id: string
          reporter_username: string
          resolution_action?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          status?: string
          store_id?: string | null
          target_id?: string | null
          target_type: string
          target_user_id?: string | null
          target_username?: string | null
          updated_at?: string | null
        }
        Update: {
          club_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          priority?: number | null
          reason?: string
          reporter_id?: string
          reporter_username?: string
          resolution_action?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          store_id?: string | null
          target_id?: string | null
          target_type?: string
          target_user_id?: string | null
          target_username?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "book_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
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
      store_carousel_items: {
        Row: {
          book_author: string
          book_image_alt: string | null
          book_image_url: string | null
          book_isbn: string | null
          book_title: string
          click_destination_url: string | null
          created_at: string | null
          custom_description: string | null
          display_order: number | null
          featured_badge: string | null
          id: string
          is_active: boolean | null
          overlay_text: string | null
          position: number
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          book_author: string
          book_image_alt?: string | null
          book_image_url?: string | null
          book_isbn?: string | null
          book_title: string
          click_destination_url?: string | null
          created_at?: string | null
          custom_description?: string | null
          display_order?: number | null
          featured_badge?: string | null
          id?: string
          is_active?: boolean | null
          overlay_text?: string | null
          position: number
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          book_author?: string
          book_image_alt?: string | null
          book_image_url?: string | null
          book_isbn?: string | null
          book_title?: string
          click_destination_url?: string | null
          created_at?: string | null
          custom_description?: string | null
          display_order?: number | null
          featured_badge?: string | null
          id?: string
          is_active?: boolean | null
          overlay_text?: string | null
          position?: number
          store_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_carousel_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_community_showcase: {
        Row: {
          activity_feed_limit: number | null
          created_at: string | null
          featured_member_id: string | null
          id: string
          max_spotlights_display: number | null
          show_activity_feed: boolean | null
          show_community_metrics: boolean | null
          show_member_spotlights: boolean | null
          show_testimonials: boolean | null
          spotlight_description: string | null
          spotlight_end_date: string | null
          spotlight_rotation_days: number | null
          spotlight_start_date: string | null
          spotlight_type: string | null
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          activity_feed_limit?: number | null
          created_at?: string | null
          featured_member_id?: string | null
          id?: string
          max_spotlights_display?: number | null
          show_activity_feed?: boolean | null
          show_community_metrics?: boolean | null
          show_member_spotlights?: boolean | null
          show_testimonials?: boolean | null
          spotlight_description?: string | null
          spotlight_end_date?: string | null
          spotlight_rotation_days?: number | null
          spotlight_start_date?: string | null
          spotlight_type?: string | null
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_feed_limit?: number | null
          created_at?: string | null
          featured_member_id?: string | null
          id?: string
          max_spotlights_display?: number | null
          show_activity_feed?: boolean | null
          show_community_metrics?: boolean | null
          show_member_spotlights?: boolean | null
          show_testimonials?: boolean | null
          spotlight_description?: string | null
          spotlight_end_date?: string | null
          spotlight_rotation_days?: number | null
          spotlight_start_date?: string | null
          spotlight_type?: string | null
          store_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_community_showcase_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_custom_quotes: {
        Row: {
          created_at: string | null
          display_order: number | null
          end_date: string | null
          id: string
          is_active: boolean | null
          quote_author: string | null
          quote_category: string | null
          quote_source: string | null
          quote_tags: string[] | null
          quote_text: string
          rotation_enabled: boolean | null
          start_date: string | null
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          quote_author?: string | null
          quote_category?: string | null
          quote_source?: string | null
          quote_tags?: string[] | null
          quote_text: string
          rotation_enabled?: boolean | null
          start_date?: string | null
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          quote_author?: string | null
          quote_category?: string | null
          quote_source?: string | null
          quote_tags?: string[] | null
          quote_text?: string
          rotation_enabled?: boolean | null
          start_date?: string | null
          store_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_custom_quotes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_landing_analytics: {
        Row: {
          element_id: string | null
          element_type: string | null
          event_type: string
          id: string
          interaction_data: Json | null
          ip_address: unknown | null
          page_url: string | null
          referrer_url: string | null
          section_name: string | null
          session_id: string | null
          store_id: string | null
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          element_id?: string | null
          element_type?: string | null
          event_type: string
          id?: string
          interaction_data?: Json | null
          ip_address?: unknown | null
          page_url?: string | null
          referrer_url?: string | null
          section_name?: string | null
          session_id?: string | null
          store_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          element_id?: string | null
          element_type?: string | null
          event_type?: string
          id?: string
          interaction_data?: Json | null
          ip_address?: unknown | null
          page_url?: string | null
          referrer_url?: string | null
          section_name?: string | null
          session_id?: string | null
          store_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_landing_analytics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_landing_customization: {
        Row: {
          chat_button_color_scheme: string | null
          chat_button_position: string | null
          chat_button_size: string | null
          chat_button_text: string | null
          created_at: string | null
          hero_font_style: string | null
          hero_quote: string | null
          hero_quote_author: string | null
          id: string
          is_chat_button_enabled: boolean | null
          sections_enabled: Json | null
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          chat_button_color_scheme?: string | null
          chat_button_position?: string | null
          chat_button_size?: string | null
          chat_button_text?: string | null
          created_at?: string | null
          hero_font_style?: string | null
          hero_quote?: string | null
          hero_quote_author?: string | null
          id?: string
          is_chat_button_enabled?: boolean | null
          sections_enabled?: Json | null
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          chat_button_color_scheme?: string | null
          chat_button_position?: string | null
          chat_button_size?: string | null
          chat_button_text?: string | null
          created_at?: string | null
          hero_font_style?: string | null
          hero_quote?: string | null
          hero_quote_author?: string | null
          id?: string
          is_chat_button_enabled?: boolean | null
          sections_enabled?: Json | null
          store_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_landing_customization_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_promotional_banners: {
        Row: {
          animation_duration: number | null
          animation_type: string | null
          background_color: string | null
          banner_image_alt: string | null
          banner_image_url: string | null
          content_type: string | null
          created_at: string | null
          cta_text: string | null
          cta_url: string | null
          display_duration: number | null
          end_date: string | null
          id: string
          is_active: boolean | null
          priority_order: number | null
          start_date: string | null
          store_id: string | null
          subtitle: string | null
          text_color: string | null
          text_content: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          animation_duration?: number | null
          animation_type?: string | null
          background_color?: string | null
          banner_image_alt?: string | null
          banner_image_url?: string | null
          content_type?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          display_duration?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          priority_order?: number | null
          start_date?: string | null
          store_id?: string | null
          subtitle?: string | null
          text_color?: string | null
          text_content?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          animation_duration?: number | null
          animation_type?: string | null
          background_color?: string | null
          banner_image_alt?: string | null
          banner_image_url?: string | null
          content_type?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          display_duration?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          priority_order?: number | null
          start_date?: string | null
          store_id?: string | null
          subtitle?: string | null
          text_color?: string | null
          text_content?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_promotional_banners_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_testimonials: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          customer_name: string | null
          display_order: number | null
          id: string
          is_anonymous: boolean | null
          is_featured: boolean | null
          rating: number | null
          source_type: string | null
          source_url: string | null
          store_id: string | null
          testimonial_text: string
          updated_at: string | null
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          customer_name?: string | null
          display_order?: number | null
          id?: string
          is_anonymous?: boolean | null
          is_featured?: boolean | null
          rating?: number | null
          source_type?: string | null
          source_url?: string | null
          store_id?: string | null
          testimonial_text: string
          updated_at?: string | null
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          customer_name?: string | null
          display_order?: number | null
          id?: string
          is_anonymous?: boolean | null
          is_featured?: boolean | null
          rating?: number | null
          source_type?: string | null
          source_url?: string | null
          store_id?: string | null
          testimonial_text?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_testimonials_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          allow_public_club_creation: boolean | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          allow_public_club_creation?: boolean | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          allow_public_club_creation?: boolean | null
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
      user_warnings: {
        Row: {
          acknowledged_at: string | null
          club_id: string | null
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          issued_by: string
          reason: string
          related_action_id: string | null
          related_report_id: string | null
          severity: string
          store_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          club_id?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          issued_by: string
          reason: string
          related_action_id?: string | null
          related_report_id?: string | null
          severity: string
          store_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          club_id?: string | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          issued_by?: string
          reason?: string
          related_action_id?: string | null
          related_report_id?: string | null
          severity?: string
          store_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_warnings_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "book_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_warnings_related_action_id_fkey"
            columns: ["related_action_id"]
            isOneToOne: false
            referencedRelation: "moderation_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_warnings_related_report_id_fkey"
            columns: ["related_report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_warnings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_tier: string
          allow_chats: boolean | null
          allow_direct_messages: boolean | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          displayname: string | null
          email: string
          favorite_author: string | null
          favorite_genre: string | null
          id: string
          membership_tier: string
          username: string
        }
        Insert: {
          account_tier?: string
          allow_chats?: boolean | null
          allow_direct_messages?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          displayname?: string | null
          email: string
          favorite_author?: string | null
          favorite_genre?: string | null
          id: string
          membership_tier?: string
          username: string
        }
        Update: {
          account_tier?: string
          allow_chats?: boolean | null
          allow_direct_messages?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          displayname?: string | null
          email?: string
          favorite_author?: string | null
          favorite_genre?: string | null
          id?: string
          membership_tier?: string
          username?: string
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
      cleanup_expired_messages: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_daily_analytics_snapshot: {
        Args: { p_club_id: string }
        Returns: undefined
      }
      create_meeting_notifications: {
        Args: {
          p_meeting_id: string
          p_club_id: string
          p_notification_type?: string
        }
        Returns: undefined
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
      get_club_analytics_summary: {
        Args: { p_club_id: string }
        Returns: {
          member_count: number
          active_members_week: number
          discussion_count: number
          posts_count: number
          reading_completion_rate: number
          total_meetings: number
          upcoming_meetings: number
          meetings_this_month: number
        }[]
      }
      get_club_meeting_analytics: {
        Args: { p_club_id: string }
        Returns: {
          total_meetings: number
          upcoming_meetings: number
          meetings_this_month: number
          avg_duration_minutes: number
          most_common_type: string
        }[]
      }
      get_club_meeting_rsvp_stats: {
        Args: { p_club_id: string }
        Returns: {
          meeting_id: string
          meeting_title: string
          scheduled_at: string
          total_rsvps: number
          going_count: number
          maybe_count: number
          not_going_count: number
          response_rate: number
        }[]
      }
      get_club_reading_stats: {
        Args: { p_club_id: string }
        Returns: {
          total_members: number
          not_started_count: number
          reading_count: number
          finished_count: number
          completion_percentage: number
        }[]
      }
      get_club_meetings: {
        Args: {
          p_club_id: string
          p_upcoming_only?: boolean
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          club_id: string
          title: string
          description: string
          meeting_type: string
          scheduled_at: string
          duration_minutes: number
          virtual_link: string
          max_attendees: number
          is_recurring: boolean
          recurrence_pattern: Json
          created_by: string
          created_at: string
          updated_at: string
          creator_username: string
        }[]
      }
      get_meeting_rsvp_stats: {
        Args: { p_meeting_id: string }
        Returns: {
          total_rsvps: number
          going_count: number
          maybe_count: number
          not_going_count: number
          response_rate: number
        }[]
      }
      get_unread_message_count: {
        Args: { conversation_id: string; user_id: string }
        Returns: number
      }
      get_user_message_retention_days: {
        Args: { user_id: string }
        Returns: number
      }
      get_user_retention_info: {
        Args: { user_id: string }
        Returns: {
          tier: string
          retention_days: number
          expires_at: string
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
      is_user_conversation_participant: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: boolean
      }
      soft_delete_expired_messages: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      test_messaging_rls_policies: {
        Args: Record<PropertyKey, never>
        Returns: string
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
