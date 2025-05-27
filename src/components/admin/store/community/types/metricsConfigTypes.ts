/**
 * Community Metrics Config Types
 * Type definitions for the community metrics configuration interface
 */

import type { CommunityMetrics, ActivityFeedItem } from '@/lib/api/store/types/communityShowcaseTypes';

// ===== MAIN COMPONENT PROPS =====

export interface CommunityMetricsConfigProps {
  metrics?: CommunityMetrics;
  activities: ActivityFeedItem[];
  settings: CommunityShowcaseSettings;
  onSettingsUpdate: (settings: Partial<CommunityShowcaseSettings>) => void;
  onRefresh: () => void;
}

// ===== SETTINGS TYPES =====

export interface CommunityShowcaseSettings {
  show_member_spotlights: boolean;
  show_testimonials: boolean;
  show_activity_feed: boolean;
  show_community_metrics: boolean;
  max_spotlights_display: number;
  activity_feed_limit: number;
}

export type SettingsKey = keyof CommunityShowcaseSettings;

// ===== COMPONENT PROPS =====

export interface DisplaySettingsProps {
  settings: CommunityShowcaseSettings;
  onSettingsUpdate: (settings: Partial<CommunityShowcaseSettings>) => void;
}

export interface MetricsDisplayProps {
  metrics?: CommunityMetrics;
  onRefresh: () => void;
}

export interface ActivityPreviewProps {
  activities: ActivityFeedItem[];
  settings: CommunityShowcaseSettings;
}

export interface ShowcaseSummaryProps {
  settings: CommunityShowcaseSettings;
}

export interface SettingsSectionProps {
  settingKey: SettingsKey;
  label: string;
  description: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  children?: React.ReactNode;
}

export interface NumberInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
}

export interface ActivityItemProps {
  activity: ActivityFeedItem;
  index: number;
}

export interface MetricCardProps {
  metricKey: string;
  value: number;
  icon: React.ComponentType<any>;
  label: string;
  description: string;
  color: string;
}

// ===== METRIC CONFIGURATION TYPES =====

export interface MetricCardConfig {
  key: string;
  icon: React.ComponentType<any>;
  label: string;
  description: string;
  color: string;
}

export interface ActivityTypeConfig {
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

export interface SettingConfig {
  key: SettingsKey;
  label: string;
  description: string;
  hasSubSettings: boolean;
  subSettings?: SubSettingConfig[];
}

export interface SubSettingConfig {
  key: SettingsKey;
  label: string;
  type: 'number' | 'text' | 'boolean';
  min?: number;
  max?: number;
  defaultValue?: any;
}

// ===== UTILITY TYPES =====

export type ActivityType = 'discussion' | 'member_join' | 'book_set' | 'club_created';

export interface FormattedActivity extends ActivityFeedItem {
  formattedTime: string;
  typeConfig: ActivityTypeConfig;
}

export interface MetricValue {
  key: string;
  value: number;
  formatted: string;
}

// ===== HOOK RETURN TYPES =====

export interface UseMetricsFormattingResult {
  formatValue: (num: number) => string;
  formatTimeAgo: (dateString: string) => string;
  formatActivities: (activities: ActivityFeedItem[]) => FormattedActivity[];
}

export interface UseSettingsManagerResult {
  settings: CommunityShowcaseSettings;
  updateSetting: <K extends SettingsKey>(key: K, value: CommunityShowcaseSettings[K]) => void;
  updateMultipleSettings: (updates: Partial<CommunityShowcaseSettings>) => void;
  resetSettings: () => void;
  isFeatureEnabled: (feature: SettingsKey) => boolean;
  getEnabledFeaturesCount: () => number;
}

export interface UseActivityDisplayResult {
  displayedActivities: ActivityFeedItem[];
  hasMoreActivities: boolean;
  activityCount: {
    shown: number;
    total: number;
  };
}

// ===== EVENT HANDLER TYPES =====

export type SettingsUpdateHandler = (settings: Partial<CommunityShowcaseSettings>) => void;
export type RefreshHandler = () => void;
export type ToggleHandler = (checked: boolean) => void;
export type NumberChangeHandler = (value: number) => void;

// ===== VALIDATION TYPES =====

export interface SettingsValidation {
  isValid: boolean;
  errors: Partial<Record<SettingsKey, string>>;
}

export interface ValidationRule {
  key: SettingsKey;
  validate: (value: any, settings: CommunityShowcaseSettings) => string | undefined;
}

// ===== DISPLAY STATE TYPES =====

export interface DisplayState {
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
}

export interface MetricsState extends DisplayState {
  metrics?: CommunityMetrics;
  lastUpdated?: Date;
}

export interface ActivitiesState extends DisplayState {
  activities: ActivityFeedItem[];
  filteredActivities: ActivityFeedItem[];
}

// ===== CONFIGURATION TYPES =====

export interface MetricsConfigState {
  settings: CommunityShowcaseSettings;
  metrics: MetricsState;
  activities: ActivitiesState;
  display: DisplayState;
}

export interface ConfigurationOptions {
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
  maxActivities?: number;
  defaultSettings?: Partial<CommunityShowcaseSettings>;
}

// ===== SUMMARY TYPES =====

export interface FeatureSummary {
  key: SettingsKey;
  label: string;
  enabled: boolean;
  icon: '✓' | '✗';
}

export interface ShowcaseStatus {
  totalFeatures: number;
  enabledFeatures: number;
  isVisible: boolean;
  features: FeatureSummary[];
}

// ===== EXPORT UTILITY TYPES =====

export type MetricKeys = keyof CommunityMetrics;
export type ActivityTypes = ActivityFeedItem['type'];
export type SettingsKeys = keyof CommunityShowcaseSettings;
