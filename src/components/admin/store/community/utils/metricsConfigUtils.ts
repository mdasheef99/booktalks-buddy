/**
 * Community Metrics Config Utility Functions
 * Helper functions for metrics configuration operations
 */

import type { 
  CommunityMetrics, 
  ActivityFeedItem 
} from '@/lib/api/store/types/communityShowcaseTypes';
import type { 
  CommunityShowcaseSettings,
  FormattedActivity,
  MetricValue,
  FeatureSummary,
  ShowcaseStatus,
  ActivityType
} from '../types/metricsConfigTypes';
import { 
  TIME_UNITS, 
  TIME_LABELS, 
  ACTIVITY_TYPE_CONFIG,
  DEFAULT_SETTINGS,
  UI_TEXT
} from '../constants/metricsConfigConstants';

// ===== VALUE FORMATTING =====

/**
 * Format numeric values for display
 */
export const formatValue = (num: number): string => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

/**
 * Format timestamp to relative time
 */
export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < TIME_UNITS.MINUTE) {
    return TIME_LABELS.JUST_NOW;
  } else if (diffInSeconds < TIME_UNITS.HOUR) {
    const minutes = Math.floor(diffInSeconds / TIME_UNITS.MINUTE);
    return TIME_LABELS.MINUTES_AGO(minutes);
  } else if (diffInSeconds < TIME_UNITS.DAY) {
    const hours = Math.floor(diffInSeconds / TIME_UNITS.HOUR);
    return TIME_LABELS.HOURS_AGO(hours);
  } else {
    const days = Math.floor(diffInSeconds / TIME_UNITS.DAY);
    return TIME_LABELS.DAYS_AGO(days);
  }
};

/**
 * Format metrics values for display
 */
export const formatMetricsValues = (metrics: CommunityMetrics): MetricValue[] => {
  return Object.entries(metrics).map(([key, value]) => ({
    key,
    value: value || 0,
    formatted: formatValue(value || 0)
  }));
};

// ===== ACTIVITY PROCESSING =====

/**
 * Get activity type configuration
 */
export const getActivityTypeConfig = (type: ActivityType) => {
  return ACTIVITY_TYPE_CONFIG[type] || ACTIVITY_TYPE_CONFIG.discussion;
};

/**
 * Format activities with additional display information
 */
export const formatActivities = (activities: ActivityFeedItem[]): FormattedActivity[] => {
  return activities.map(activity => ({
    ...activity,
    formattedTime: formatTimeAgo(activity.created_at),
    typeConfig: getActivityTypeConfig(activity.type as ActivityType)
  }));
};

/**
 * Filter activities by limit
 */
export const getDisplayedActivities = (
  activities: ActivityFeedItem[], 
  limit: number
): { displayed: ActivityFeedItem[]; hasMore: boolean } => {
  const displayed = activities.slice(0, limit);
  const hasMore = activities.length > limit;
  
  return { displayed, hasMore };
};

/**
 * Get activity count information
 */
export const getActivityCount = (activities: ActivityFeedItem[], limit: number) => {
  return {
    shown: Math.min(activities.length, limit),
    total: activities.length
  };
};

// ===== SETTINGS MANAGEMENT =====

/**
 * Create default settings
 */
export const createDefaultSettings = (): CommunityShowcaseSettings => ({
  ...DEFAULT_SETTINGS
});

/**
 * Validate settings values
 */
export const validateSettings = (settings: CommunityShowcaseSettings): boolean => {
  return (
    settings.activity_feed_limit >= 3 && 
    settings.activity_feed_limit <= 10 &&
    settings.max_spotlights_display >= 1 && 
    settings.max_spotlights_display <= 6
  );
};

/**
 * Merge settings with defaults
 */
export const mergeWithDefaults = (
  settings: Partial<CommunityShowcaseSettings>
): CommunityShowcaseSettings => {
  return {
    ...DEFAULT_SETTINGS,
    ...settings
  };
};

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = (
  settings: CommunityShowcaseSettings, 
  feature: keyof CommunityShowcaseSettings
): boolean => {
  return Boolean(settings[feature]);
};

/**
 * Get count of enabled features
 */
export const getEnabledFeaturesCount = (settings: CommunityShowcaseSettings): number => {
  const featureKeys: (keyof CommunityShowcaseSettings)[] = [
    'show_member_spotlights',
    'show_testimonials', 
    'show_activity_feed',
    'show_community_metrics'
  ];
  
  return featureKeys.filter(key => settings[key]).length;
};

/**
 * Check if showcase should be visible
 */
export const isShowcaseVisible = (settings: CommunityShowcaseSettings): boolean => {
  return getEnabledFeaturesCount(settings) > 0;
};

// ===== SUMMARY GENERATION =====

/**
 * Generate feature summary
 */
export const generateFeatureSummary = (settings: CommunityShowcaseSettings): FeatureSummary[] => {
  return [
    {
      key: 'show_member_spotlights',
      label: UI_TEXT.SUMMARY_FEATURES.MEMBER_SPOTLIGHTS,
      enabled: settings.show_member_spotlights,
      icon: settings.show_member_spotlights ? '✓' : '✗'
    },
    {
      key: 'show_testimonials',
      label: UI_TEXT.SUMMARY_FEATURES.TESTIMONIALS,
      enabled: settings.show_testimonials,
      icon: settings.show_testimonials ? '✓' : '✗'
    },
    {
      key: 'show_activity_feed',
      label: UI_TEXT.SUMMARY_FEATURES.ACTIVITY_FEED,
      enabled: settings.show_activity_feed,
      icon: settings.show_activity_feed ? '✓' : '✗'
    },
    {
      key: 'show_community_metrics',
      label: UI_TEXT.SUMMARY_FEATURES.COMMUNITY_METRICS,
      enabled: settings.show_community_metrics,
      icon: settings.show_community_metrics ? '✓' : '✗'
    }
  ];
};

/**
 * Generate showcase status
 */
export const generateShowcaseStatus = (settings: CommunityShowcaseSettings): ShowcaseStatus => {
  const features = generateFeatureSummary(settings);
  const enabledFeatures = getEnabledFeaturesCount(settings);
  
  return {
    totalFeatures: features.length,
    enabledFeatures,
    isVisible: enabledFeatures > 0,
    features
  };
};

// ===== METRICS PROCESSING =====

/**
 * Check if metrics are available
 */
export const hasMetrics = (metrics?: CommunityMetrics): boolean => {
  return Boolean(metrics && Object.keys(metrics).length > 0);
};

/**
 * Get metric value safely
 */
export const getMetricValue = (metrics: CommunityMetrics | undefined, key: string): number => {
  if (!metrics) return 0;
  return (metrics as any)[key] || 0;
};

/**
 * Calculate total metrics
 */
export const calculateTotalMetrics = (metrics?: CommunityMetrics): number => {
  if (!metrics) return 0;
  
  return Object.values(metrics).reduce((total, value) => total + (value || 0), 0);
};

// ===== VALIDATION HELPERS =====

/**
 * Validate activity feed limit
 */
export const validateActivityFeedLimit = (limit: number): boolean => {
  return limit >= 3 && limit <= 10;
};

/**
 * Validate spotlights display limit
 */
export const validateSpotlightsLimit = (limit: number): boolean => {
  return limit >= 1 && limit <= 6;
};

/**
 * Get validation error message
 */
export const getValidationError = (
  key: keyof CommunityShowcaseSettings, 
  value: any
): string | undefined => {
  switch (key) {
    case 'activity_feed_limit':
      if (!validateActivityFeedLimit(value)) {
        return 'Activity feed limit must be between 3 and 10';
      }
      break;
    case 'max_spotlights_display':
      if (!validateSpotlightsLimit(value)) {
        return 'Spotlights limit must be between 1 and 6';
      }
      break;
  }
  return undefined;
};

// ===== DISPLAY HELPERS =====

/**
 * Get empty state message for activities
 */
export const getActivityEmptyStateMessage = (): { title: string; description: string } => {
  return {
    title: UI_TEXT.LOADING_STATES.NO_ACTIVITY,
    description: UI_TEXT.LOADING_STATES.ACTIVITY_DESCRIPTION
  };
};

/**
 * Get metrics loading message
 */
export const getMetricsLoadingMessage = (): string => {
  return UI_TEXT.LOADING_STATES.METRICS;
};

/**
 * Generate activity count display text
 */
export const getActivityCountText = (shown: number, total: number): string => {
  return UI_TEXT.ACTIVITY_DISPLAY.SHOWING_COUNT(shown, total);
};
