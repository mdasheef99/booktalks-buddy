import { useState, useEffect } from 'react';
import { DashboardStats, TimeRange } from '../types';
import {
  getTimeRangeStartDate,
  getRecentActivityStartDate,
  formatDateForQuery,
  getPreviousPeriodStartDate,
  getPeriodEndDate
} from '../utils/dateUtils';
import { fetchAllStats } from '../services/adminStatsService';
import { processStats } from '../utils/statsProcessor';

// Initial stats state
const initialStats: DashboardStats = {
  totalClubs: 0,
  totalMembers: 0,
  totalDiscussions: 0,
  totalUsers: 0,
  newUsersInRange: 0,
  newClubsInRange: 0,
  clubsWithCurrentBook: 0,
  pendingJoinRequests: 0,
  activeDiscussions: 0,
  booksInProgress: 0,
  avgMembersPerClub: 0,
  avgDiscussionsPerClub: 0,
  recentActivity: {
    newUsers: 0,
    newClubs: 0,
    newDiscussions: 0
  },
  tierDistribution: {
    free: 0,
    privileged: 0,
    privileged_plus: 0
  },
  // Previous period stats
  previousPeriod: {
    newUsers: 0,
    newClubs: 0,
    activeDiscussions: 0
  },
  // Growth rates
  growthRates: {
    users: 0,
    clubs: 0,
    discussions: 0
  },
  // User acquisition metrics
  userAcquisition: {
    averagePerWeek: 0,
    averagePerMonth: 0,
    trend: [0, 0, 0, 0, 0, 0] // 6 data points for sparkline
  },
  lastUpdated: new Date().toISOString()
};

/**
 * Calculate date ranges for queries
 * @param timeRange The selected time range
 * @returns Date ranges for queries
 */
const calculateDateRanges = (timeRange: TimeRange) => {
  try {
    // Calculate current period dates
    const rangeStartDate = getTimeRangeStartDate(timeRange);
    const rangeStartStr = formatDateForQuery(rangeStartDate);

    const currentPeriodEndDate = getPeriodEndDate(rangeStartDate, timeRange);
    const currentPeriodEndStr = formatDateForQuery(currentPeriodEndDate);

    // Calculate previous period dates
    const previousPeriodStartDate = getPreviousPeriodStartDate(timeRange, rangeStartDate);
    const previousPeriodStartStr = formatDateForQuery(previousPeriodStartDate);

    const previousPeriodEndDate = getPeriodEndDate(previousPeriodStartDate, timeRange);
    const previousPeriodEndStr = formatDateForQuery(previousPeriodEndDate);

    // Calculate recent activity date
    const recentActivityStart = getRecentActivityStartDate();
    const recentActivityStartStr = formatDateForQuery(recentActivityStart);

    return {
      rangeStartDate,
      rangeStartStr,
      currentPeriodEndStr,
      previousPeriodStartDate,
      previousPeriodStartStr,
      previousPeriodEndStr,
      recentActivityStartStr
    };
  } catch (error) {
    console.error('Error calculating date ranges:', error);

    // Return fallback dates
    return {
      rangeStartDate: new Date(2000, 0, 1),
      rangeStartStr: '2000-01-01T00:00:00.000Z',
      currentPeriodEndStr: new Date().toISOString(),
      previousPeriodStartDate: new Date(2000, 0, 1),
      previousPeriodStartStr: '2000-01-01T00:00:00.000Z',
      previousPeriodEndStr: '2000-01-01T00:00:00.000Z',
      recentActivityStartStr: '2000-01-01T00:00:00.000Z'
    };
  }
};

/**
 * Format error message for user-friendly display
 * @param err The error object
 * @returns User-friendly error message
 */
const formatErrorMessage = (err: any): string => {
  let errorMessage = 'Failed to load dashboard data';

  // Check if it's a 400 Bad Request error
  const is400Error =
    (err instanceof Error && err.message.includes('400')) ||
    (err && typeof err === 'object' && 'status' in err && err.status === 400);

  if (is400Error) {
    errorMessage = 'Invalid request to the database. This might be due to a temporary issue. Please try refreshing the page.';
  } else if (err instanceof Error) {
    if (err.message.includes('Authentication')) {
      errorMessage = 'Authentication error. Please log in again.';
    } else if (err.message.includes('Database')) {
      errorMessage = 'Database connection error. Please try again later.';
    } else if (err.message.includes('not found') || err.message.includes('does not exist')) {
      errorMessage = 'Database table or column not found. This might be due to a missing migration.';
    } else {
      errorMessage = `Error: ${err.message}`;
    }
  } else if (err && typeof err === 'object') {
    // Try to extract more information from the error object
    errorMessage = `Error: ${JSON.stringify(err)}`;
  }

  return errorMessage;
};

/**
 * Hook for fetching admin dashboard statistics
 * @param timeRange The selected time range for filtering data
 * @param refreshKey Optional key that triggers a refresh when changed
 * @returns Loading state, error state, and dashboard statistics
 */
export const useAdminStats = (timeRange: TimeRange, refreshKey: number = 0) => {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Calculate date ranges for queries
        const dateRanges = calculateDateRanges(timeRange);

        // Log date ranges
        console.log('Using date ranges:', {
          timeRange,
          rangeStartStr: dateRanges.rangeStartStr,
          currentPeriodEndStr: dateRanges.currentPeriodEndStr,
          previousPeriodStartStr: dateRanges.previousPeriodStartStr,
          previousPeriodEndStr: dateRanges.previousPeriodEndStr,
          recentActivityStartStr: dateRanges.recentActivityStartStr
        });

        // Fetch all stats from the service
        const rawStats = await fetchAllStats({
          rangeStartStr: dateRanges.rangeStartStr,
          currentPeriodEndStr: dateRanges.currentPeriodEndStr,
          previousPeriodStartStr: dateRanges.previousPeriodStartStr,
          previousPeriodEndStr: dateRanges.previousPeriodEndStr,
          recentActivityStartStr: dateRanges.recentActivityStartStr
        });

        // Process stats to calculate derived metrics
        const processedStats = processStats(rawStats, dateRanges.rangeStartDate);

        // Log the processed data
        console.log('Processed stats:', processedStats);

        // Update stats state
        setStats(processedStats);
      } catch (err) {
        console.error('Error fetching admin stats:', err);

        // Format error message for user-friendly display
        const errorMessage = formatErrorMessage(err);
        setError(new Error(errorMessage));

        console.log('Setting fallback data due to error');

        // Use the initial stats as fallback
        setStats({
          ...initialStats,
          lastUpdated: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Log refresh attempt
    console.log(`Fetching stats with timeRange: ${timeRange}, refreshKey: ${refreshKey}`);
  }, [timeRange, refreshKey]);

  return { loading, error, stats };
};
