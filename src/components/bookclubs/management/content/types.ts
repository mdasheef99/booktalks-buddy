/**
 * Types for content moderation components
 */

export interface Topic {
  id: string;
  club_id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  is_locked?: boolean;
  post_count?: number;
  creator?: {
    username?: string;
    display_name?: string;
  };
}

export interface Post {
  id: string;
  topic_id: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  creator?: {
    username?: string;
    display_name?: string;
  };
}

export interface ContentModerationPanelProps {
  clubId: string;
}
