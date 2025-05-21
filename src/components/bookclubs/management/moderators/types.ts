/**
 * Types for moderator management components
 */

export interface Moderator {
  club_id: string;
  user_id: string;
  assigned_by_user_id: string;
  assigned_at: string;
  user?: {
    username?: string;
    email?: string;
    display_name?: string;
  };
}

export interface Member {
  user_id: string;
  club_id: string;
  role: string;
  joined_at: string;
  user?: {
    username?: string;
    email?: string;
    display_name?: string;
  };
}

export interface ModeratorManagementPanelProps {
  clubId: string;
}
