import { supabase } from '@/lib/supabase';
import { TimeRange, UserGrowthData, ActivityData, UserStats, AnalyticsData } from './types';
import { calculateTimeLimit, formatDateAsYearMonth } from './utils';

/**
 * Fetch user data from Supabase
 * @returns Array of user data with creation dates and account tiers
 */
export const fetchUserData = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('created_at, membership_tier')
    .order('created_at');

  if (error) throw error;
  return data || [];
};

/**
 * Fetch discussion data from Supabase
 * @returns Array of discussion data with creation dates
 */
export const fetchDiscussionData = async () => {
  const { data, error } = await supabase
    .from('discussion_topics')
    .select('created_at')
    .order('created_at');

  if (error) throw error;
  return data || [];
};

/**
 * Fetch club data from Supabase
 * @returns Array of club data with creation dates
 */
export const fetchClubData = async () => {
  const { data, error } = await supabase
    .from('book_clubs')
    .select('created_at')
    .order('created_at');

  if (error) throw error;
  return data || [];
};

/**
 * Process user data to generate user growth data
 * @param userData Array of user data
 * @param timeRange Selected time range
 * @returns Processed user growth data
 */
export const processUserGrowthData = (
  userData: any[],
  timeRange: TimeRange
): UserGrowthData[] => {
  const timeLimit = calculateTimeLimit(timeRange);
  const dateMap = new Map<string, { total: number; new: number }>();
  
  // Count users before the time range for cumulative calculation
  let usersBefore = 0;
  if (timeRange !== 'all') {
    usersBefore = userData.filter(user => {
      if (!user.created_at) return false;
      const date = new Date(user.created_at);
      return date < timeLimit;
    }).length;
  }

  // Group users by month
  userData.forEach(user => {
    if (!user.created_at) return;

    const date = new Date(user.created_at);
    // Skip if outside the selected time range
    if (date < timeLimit) return;

    // Format date as YYYY-MM
    const monthKey = formatDateAsYearMonth(date);

    const currentData = dateMap.get(monthKey) || { total: 0, new: 0 };
    currentData.new += 1;
    dateMap.set(monthKey, currentData);
  });

  // Sort dates and create cumulative data
  const sortedDates = Array.from(dateMap.keys()).sort();
  let cumulativeCount = usersBefore;
  
  return sortedDates.map(date => {
    const monthData = dateMap.get(date) || { total: 0, new: 0 };
    cumulativeCount += monthData.new;
    return {
      date,
      count: cumulativeCount,
      newUsers: monthData.new
    };
  });
};

/**
 * Process activity data (discussions and clubs)
 * @param discussionData Array of discussion data
 * @param clubData Array of club data
 * @param timeRange Selected time range
 * @returns Processed activity data
 */
export const processActivityData = (
  discussionData: any[],
  clubData: any[],
  timeRange: TimeRange
): ActivityData[] => {
  const timeLimit = calculateTimeLimit(timeRange);
  const activityByMonth = new Map<string, { discussions: number; clubs: number }>();

  // Process discussions
  discussionData.forEach(discussion => {
    if (!discussion.created_at) return;

    const date = new Date(discussion.created_at);
    // Skip if outside the selected time range
    if (date < timeLimit) return;

    // Format date as YYYY-MM
    const monthKey = formatDateAsYearMonth(date);

    const currentData = activityByMonth.get(monthKey) || { discussions: 0, clubs: 0 };
    currentData.discussions += 1;
    activityByMonth.set(monthKey, currentData);
  });

  // Process clubs
  clubData.forEach(club => {
    if (!club.created_at) return;

    const date = new Date(club.created_at);
    // Skip if outside the selected time range
    if (date < timeLimit) return;

    // Format date as YYYY-MM
    const monthKey = formatDateAsYearMonth(date);

    const currentData = activityByMonth.get(monthKey) || { discussions: 0, clubs: 0 };
    currentData.clubs += 1;
    activityByMonth.set(monthKey, currentData);
  });

  // Convert to array and sort by month
  const sortedActivityDates = Array.from(activityByMonth.keys()).sort();
  
  return sortedActivityDates.map(month => {
    const data = activityByMonth.get(month) || { discussions: 0, clubs: 0 };
    return {
      month,
      discussions: data.discussions,
      clubs: data.clubs
    };
  });
};

/**
 * Calculate user statistics
 * @param userData Array of user data
 * @returns User statistics
 */
export const calculateUserStats = (userData: any[]): UserStats => {
  const tierCounts = {
    free: 0,
    privileged: 0,
    privileged_plus: 0
  };

  userData.forEach(user => {
    if (user.membership_tier && user.membership_tier in tierCounts) {
      tierCounts[user.membership_tier as keyof typeof tierCounts]++;
    }
  });

  return {
    totalUsers: userData.length,
    activeUsers: Math.floor(userData.length * 0.7), // Placeholder - would need actual login data
    usersByTier: tierCounts
  };
};

/**
 * Fetch all analytics data
 * @param timeRange Selected time range
 * @returns Combined analytics data
 */
export const fetchAnalyticsData = async (timeRange: TimeRange): Promise<AnalyticsData> => {
  try {
    // Fetch all required data in parallel
    const [userData, discussionData, clubData] = await Promise.all([
      fetchUserData(),
      fetchDiscussionData(),
      fetchClubData()
    ]);

    // Process the data
    const userGrowthData = processUserGrowthData(userData, timeRange);
    const activityData = processActivityData(discussionData, clubData, timeRange);
    const userStats = calculateUserStats(userData);

    return {
      userGrowthData,
      activityData,
      userStats
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw error;
  }
};
