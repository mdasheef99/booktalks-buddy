/**
 * Dashboard types for the admin dashboard
 */

// Time range type for filtering dashboard data
export type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'halfyear' | 'year' | 'all';

// Recent activity stats
export interface RecentActivity {
  newUsers: number;
  newClubs: number;
  newDiscussions: number;
}

// User tier distribution stats
export interface TierDistribution {
  free: number;
  privileged: number;
  privileged_plus: number;
}

// Main dashboard statistics
export interface DashboardStats {
  // Main stats
  totalClubs: number;
  totalMembers: number;
  totalDiscussions: number;
  totalUsers: number;

  // Time range specific stats
  newUsersInRange: number;
  newClubsInRange: number;
  activeDiscussions: number;

  // Club stats
  clubsWithCurrentBook: number;
  pendingJoinRequests: number;
  booksInProgress: number;

  // Calculated stats
  avgMembersPerClub: number;
  avgDiscussionsPerClub: number;

  // Grouped stats
  recentActivity: RecentActivity;
  tierDistribution: TierDistribution;
}

// Props for the StatsCard component
export interface StatsCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  secondaryText?: string;
  className?: string;
}

// Props for the TimeRangeFilter component
export interface TimeRangeFilterProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

// Props for the MainStatsRow component
export interface MainStatsRowProps {
  stats: DashboardStats;
  timeRange?: TimeRange;
}

// Props for the QuickStatsRow component
export interface QuickStatsRowProps {
  stats: DashboardStats;
}

// Props for the TierDistributionCard component
export interface TierDistributionCardProps {
  tierDistribution: TierDistribution;
  totalUsers: number;
}

// Props for the RecentActivityCard component
export interface RecentActivityCardProps {
  recentActivity: RecentActivity;
}

// Props for the DashboardHeader component
export interface DashboardHeaderProps {
  pendingRequests: number;
  onNavigateBack: () => void;
  onNavigateToAnalytics: () => void;
  onNavigateToRequests: () => void;
}

// Props for the LoadingDashboard component
export interface LoadingDashboardProps {
  // No props needed for now
}
