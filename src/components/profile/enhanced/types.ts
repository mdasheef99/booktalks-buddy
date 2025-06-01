// Shared types for enhanced profile components

export interface UserMetadata {
  display_name?: string;
  username?: string;
  avatar_url?: string;
  avatar_thumbnail_url?: string;
  avatar_medium_url?: string;
  avatar_full_url?: string;
  bio?: string;
  reading_frequency?: string;
  favorite_genres?: string[];
  favorite_authors?: string[];
  preferred_meeting_times?: string[];
  [key: string]: any;
}

export interface ClubMembership {
  club_id: string;
  club_name: string;
  role: string;
  joined_at: string;
  current_book?: {
    id: string;
    title: string;
    author: string;
    cover_url: string | null;
  } | null;
}

// Reading frequency display mapping
export const READING_FREQUENCY_LABELS: Record<string, string> = {
  'voracious': 'Voracious Reader',
  'regular': 'Regular Reader',
  'casual': 'Casual Reader',
  'occasional': 'Occasional Reader'
};

// Meeting time display mapping
export const MEETING_TIME_LABELS: Record<string, string> = {
  'weekday_mornings': 'Weekday Mornings',
  'weekday_afternoons': 'Weekday Afternoons',
  'weekday_evenings': 'Weekday Evenings',
  'weekend_mornings': 'Weekend Mornings',
  'weekend_afternoons': 'Weekend Afternoons',
  'weekend_evenings': 'Weekend Evenings'
};
