/**
 * Community Metrics Config Constants
 * Centralized constants for the community metrics configuration interface
 */

import { 
  Users, 
  BookOpen, 
  MessageCircle, 
  TrendingUp, 
  UserPlus,
  BarChart3,
  Activity,
  Clock
} from 'lucide-react';

// ===== METRIC CARD CONFIGURATIONS =====

export const METRIC_CARDS = [
  {
    key: 'active_members',
    icon: Users,
    label: 'Active Members',
    description: 'Community members participating in book clubs',
    color: 'bg-blue-500'
  },
  {
    key: 'total_clubs',
    icon: BookOpen,
    label: 'Book Clubs',
    description: 'Active reading groups and discussion circles',
    color: 'bg-green-500'
  },
  {
    key: 'recent_discussions',
    icon: MessageCircle,
    label: 'Recent Discussions',
    description: 'New topics started in the last 30 days',
    color: 'bg-purple-500'
  },
  {
    key: 'books_discussed_this_month',
    icon: TrendingUp,
    label: 'Books This Month',
    description: 'Books currently being read and discussed',
    color: 'bg-orange-500'
  },
  {
    key: 'new_members_this_month',
    icon: UserPlus,
    label: 'New Members',
    description: 'Fresh faces who joined us this month',
    color: 'bg-pink-500'
  }
] as const;

// ===== ACTIVITY TYPE CONFIGURATIONS =====

export const ACTIVITY_TYPE_CONFIG = {
  discussion: {
    icon: MessageCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  member_join: {
    icon: UserPlus,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  book_set: {
    icon: BookOpen,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  club_created: {
    icon: Users,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  }
} as const;

// ===== SETTINGS CONFIGURATION =====

export const SETTINGS_CONFIG = [
  {
    key: 'show_activity_feed',
    label: 'Activity Feed',
    description: 'Show recent community activity on landing page',
    hasSubSettings: true,
    subSettings: [
      {
        key: 'activity_feed_limit',
        label: 'Number of activities to display',
        type: 'number',
        min: 3,
        max: 10,
        defaultValue: 5
      }
    ]
  },
  {
    key: 'show_community_metrics',
    label: 'Community Metrics',
    description: 'Display community statistics and growth',
    hasSubSettings: false
  },
  {
    key: 'show_member_spotlights',
    label: 'Member Spotlights',
    description: 'Feature active community members',
    hasSubSettings: true,
    subSettings: [
      {
        key: 'max_spotlights_display',
        label: 'Maximum spotlights to display',
        type: 'number',
        min: 1,
        max: 6,
        defaultValue: 3
      }
    ]
  }
] as const;

// ===== VALIDATION LIMITS =====

export const VALIDATION_LIMITS = {
  ACTIVITY_FEED_MIN: 3,
  ACTIVITY_FEED_MAX: 10,
  SPOTLIGHTS_MIN: 1,
  SPOTLIGHTS_MAX: 6,
} as const;

// ===== UI TEXT =====

export const UI_TEXT = {
  HEADERS: {
    DISPLAY_SETTINGS: 'Display Settings',
    CURRENT_METRICS: 'Current Community Metrics',
    ACTIVITY_PREVIEW: 'Recent Activity Preview',
    SHOWCASE_SUMMARY: 'Community Showcase Summary',
  },
  BUTTONS: {
    REFRESH: 'Refresh',
  },
  LOADING_STATES: {
    METRICS: 'Loading community metrics...',
    NO_ACTIVITY: 'No recent activity',
    ACTIVITY_DESCRIPTION: 'Activity will appear as members interact with your community',
  },
  ACTIVITY_DISPLAY: {
    SHOWING_COUNT: (shown: number, total: number) => `Showing ${shown} of ${total} activities`,
  },
  SUMMARY_FEATURES: {
    MEMBER_SPOTLIGHTS: 'Member Spotlights',
    TESTIMONIALS: 'Testimonials',
    ACTIVITY_FEED: 'Activity Feed',
    COMMUNITY_METRICS: 'Community Metrics',
  },
  TIP: {
    TITLE: 'Tip:',
    MESSAGE: 'Enable at least one feature to display the Community Showcase section on your landing page. The section will automatically hide if no features are enabled or if there\'s no content to display.',
  },
} as const;

// ===== CSS CLASSES =====

export const CSS_CLASSES = {
  METRIC_CARD: 'bg-gradient-to-br from-white to-gray-50/50 rounded-lg p-4 border border-gray-100',
  METRIC_ICON_CONTAINER: 'p-2 rounded-lg',
  METRIC_VALUE: 'text-2xl font-bold text-bookconnect-brown',
  METRIC_LABEL: 'font-medium text-bookconnect-brown text-sm mb-1',
  METRIC_DESCRIPTION: 'text-xs text-bookconnect-brown/60 leading-relaxed',
  ACTIVITY_ITEM: 'flex items-start space-x-3 p-3 bg-gray-50 rounded-lg',
  ACTIVITY_ICON_CONTAINER: 'flex-shrink-0 p-2 rounded-lg',
  ACTIVITY_TITLE: 'font-medium text-gray-900 text-sm truncate',
  ACTIVITY_DESCRIPTION: 'text-sm text-gray-600 mt-1',
  ACTIVITY_TIME: 'flex items-center text-xs text-gray-500',
  SUMMARY_FEATURE: 'text-2xl font-bold text-bookconnect-brown',
  SUMMARY_LABEL: 'text-sm text-gray-600',
  TIP_CONTAINER: 'mt-4 p-4 bg-blue-50 rounded-lg',
  TIP_TEXT: 'text-sm text-blue-800',
  EMPTY_STATE_ICON: 'h-12 w-12 mx-auto mb-4 opacity-30',
  SETTINGS_SECTION: 'space-y-4',
  SUB_SETTINGS: 'ml-4 space-y-2',
} as const;

// ===== DEFAULT VALUES =====

export const DEFAULT_SETTINGS = {
  show_member_spotlights: false,
  show_testimonials: false,
  show_activity_feed: false,
  show_community_metrics: false,
  max_spotlights_display: 3,
  activity_feed_limit: 5,
} as const;

// ===== TIME FORMATTING =====

export const TIME_UNITS = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
} as const;

export const TIME_LABELS = {
  JUST_NOW: 'Just now',
  MINUTES_AGO: (minutes: number) => `${minutes}m ago`,
  HOURS_AGO: (hours: number) => `${hours}h ago`,
  DAYS_AGO: (days: number) => `${days}d ago`,
} as const;

// ===== GRID CONFIGURATIONS =====

export const GRID_CONFIGS = {
  METRICS: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  SUMMARY: 'grid-cols-2 md:grid-cols-4',
} as const;
