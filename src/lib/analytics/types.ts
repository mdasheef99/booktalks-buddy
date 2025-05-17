/**
 * Types and interfaces for analytics data
 */

// Time range options for analytics
export type TimeRange = '6months' | '12months' | 'all';

// User growth data point
export interface UserGrowthData {
  date: string;
  count: number;
  newUsers: number;
}

// Activity data point
export interface ActivityData {
  month: string;
  discussions: number;
  clubs: number;
}

// User statistics
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  usersByTier: {
    free: number;
    privileged: number;
    privileged_plus: number;
  };
}

// Combined analytics data
export interface AnalyticsData {
  userGrowthData: UserGrowthData[];
  activityData: ActivityData[];
  userStats: UserStats;
}
