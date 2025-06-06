import { supabase } from '@/lib/supabase';
import { TierDistribution } from '../types';
import { safeCountQuery, checkAuthentication, verifyDatabaseConnection } from '../utils/dbUtils';

/**
 * Initialize the admin stats service
 * @returns True if initialization is successful
 * @throws Error if initialization fails
 */
export const initializeAdminStatsService = async (): Promise<boolean> => {
  // Check authentication
  await checkAuthentication();

  // Verify database connection
  const isConnected = await verifyDatabaseConnection();
  if (!isConnected) {
    throw new Error('Failed to connect to database. Please try again later.');
  }

  return true;
};

/**
 * Interface for date ranges used in queries
 */
interface DateRanges {
  rangeStartStr: string;
  currentPeriodEndStr: string;
  previousPeriodStartStr: string;
  previousPeriodEndStr: string;
  recentActivityStartStr: string;
}

/**
 * Interface for previous period statistics
 */
interface PreviousPeriodStats {
  newUsers: number;
  newClubs: number;
  activeDiscussions: number;
}

/**
 * Fetch statistics from the previous period for comparison
 * @param dateRanges Date ranges for filtering data
 * @returns Previous period statistics
 */
export const fetchPreviousPeriodStats = async (dateRanges: DateRanges): Promise<PreviousPeriodStats> => {
  let previousPeriodStats: PreviousPeriodStats = {
    newUsers: 0,
    newClubs: 0,
    activeDiscussions: 0
  };

  try {
    // Fetch new users in previous period
    previousPeriodStats.newUsers = await safeCountQuery('users', [
      { field: 'created_at', value: dateRanges.previousPeriodStartStr, operator: 'gte' },
      { field: 'created_at', value: dateRanges.previousPeriodEndStr, operator: 'lt' }
    ]);

    // Fetch new clubs in previous period
    previousPeriodStats.newClubs = await safeCountQuery('book_clubs', [
      { field: 'created_at', value: dateRanges.previousPeriodStartStr, operator: 'gte' },
      { field: 'created_at', value: dateRanges.previousPeriodEndStr, operator: 'lt' }
    ]);

    // Fetch active discussions in previous period
    previousPeriodStats.activeDiscussions = await safeCountQuery('discussion_posts', [
      { field: 'created_at', value: dateRanges.previousPeriodStartStr, operator: 'gte' },
      { field: 'created_at', value: dateRanges.previousPeriodEndStr, operator: 'lt' }
    ]);

    console.log('Previous period stats:', previousPeriodStats);
  } catch (error) {
    console.error('Error fetching previous period stats:', error);
  }

  return previousPeriodStats;
};

/**
 * Interface for recent activity statistics
 */
interface RecentActivity {
  newUsers: number;
  newClubs: number;
  newDiscussions: number;
}

/**
 * Interface for all fetched database statistics
 */
interface FetchedStats {
  totalClubs: number;
  totalMembers: number;
  totalDiscussions: number;
  totalUsers: number;
  newUsersInRange: number;
  newClubsInRange: number;
  clubsWithCurrentBook: number;
  pendingJoinRequests: number;
  activeDiscussions: number;
  booksInProgress: number;
  previousPeriod: PreviousPeriodStats;
  recentActivity: RecentActivity;
  tierDistribution: TierDistribution;
  userCreationData: Array<{ created_at: string; count?: number }>;
}

/**
 * Fetch all club-related statistics
 * @param dateRanges Date ranges for filtering data
 * @returns Club statistics
 */
export const fetchClubStats = async (dateRanges: DateRanges): Promise<{
  totalClubs: number;
  newClubsInRange: number;
  clubsWithCurrentBook: number;
  recentNewClubs: number;
}> => {
  // Fetch total clubs
  const totalClubs = await safeCountQuery('book_clubs');

  // Fetch new clubs in selected time range
  const newClubsInRange = await safeCountQuery('book_clubs', [
    { field: 'created_at', value: dateRanges.rangeStartStr, operator: 'gte' }
  ]);

  // Fetch clubs with current books
  const clubsWithCurrentBook = await safeCountQuery('current_books');

  // Fetch recent new clubs (last 7 days)
  const recentNewClubs = await safeCountQuery('book_clubs', [
    { field: 'created_at', value: dateRanges.recentActivityStartStr, operator: 'gte' }
  ]);

  return {
    totalClubs,
    newClubsInRange,
    clubsWithCurrentBook,
    recentNewClubs
  };
};

/**
 * Fetch all user-related statistics
 * @param dateRanges Date ranges for filtering data
 * @returns User statistics
 */
export const fetchUserStats = async (dateRanges: DateRanges): Promise<{
  totalUsers: number;
  newUsersInRange: number;
  recentNewUsers: number;
  userCreationData: Array<{ created_at: string; count?: number }>;
}> => {
  // Fetch total users
  const totalUsers = await safeCountQuery('users');

  // Fetch new users in selected time range
  const newUsersInRange = await safeCountQuery('users', [
    { field: 'created_at', value: dateRanges.rangeStartStr, operator: 'gte' }
  ]);

  // Fetch recent new users (last 7 days)
  const recentNewUsers = await safeCountQuery('users', [
    { field: 'created_at', value: dateRanges.recentActivityStartStr, operator: 'gte' }
  ]);

  // Fetch user creation data for trend visualization
  let userCreationData: Array<{ created_at: string; count?: number }> = [];
  try {
    const { data, error } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', dateRanges.rangeStartStr)
      .lt('created_at', dateRanges.currentPeriodEndStr)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching user creation data:', error);
    } else if (data) {
      userCreationData = data;
    }
  } catch (error) {
    console.error('Exception fetching user creation data:', error);
  }

  return {
    totalUsers,
    newUsersInRange,
    recentNewUsers,
    userCreationData
  };
};

/**
 * Fetch all discussion-related statistics
 * @param dateRanges Date ranges for filtering data
 * @returns Discussion statistics
 */
export const fetchDiscussionStats = async (dateRanges: DateRanges): Promise<{
  totalDiscussions: number;
  activeDiscussions: number;
  recentNewDiscussions: number;
}> => {
  // Fetch total discussions
  const totalDiscussions = await safeCountQuery('discussion_topics');

  // Fetch active discussions (with posts in the selected time range)
  const activeDiscussions = await safeCountQuery('discussion_posts', [
    { field: 'created_at', value: dateRanges.rangeStartStr, operator: 'gte' }
  ]);

  // Fetch recent new discussions (last 7 days)
  const recentNewDiscussions = await safeCountQuery('discussion_topics', [
    { field: 'created_at', value: dateRanges.recentActivityStartStr, operator: 'gte' }
  ]);

  return {
    totalDiscussions,
    activeDiscussions,
    recentNewDiscussions
  };
};

/**
 * Fetch all member-related statistics
 * @returns Member statistics
 */
export const fetchMemberStats = async (): Promise<{
  totalMembers: number;
  pendingJoinRequests: number;
  memberData: { user_id: string }[];
}> => {
  // Fetch pending join requests
  const pendingJoinRequests = await safeCountQuery('club_members', [
    { field: 'role', value: 'pending', operator: 'eq' }
  ]);

  // Fetch total members (unique users in club_members)
  let memberData: { user_id: string }[] = [];
  try {
    const { data, error } = await supabase
      .from('club_members')
      .select('user_id');

    if (error) {
      console.error('Error fetching club members:', error);
    } else if (data) {
      memberData = data;
    }
  } catch (error) {
    console.error('Exception fetching club members:', error);
  }

  // Calculate unique members
  const uniqueMembers = new Set<string>();
  memberData.forEach(member => uniqueMembers.add(member.user_id));

  return {
    totalMembers: uniqueMembers.size,
    pendingJoinRequests,
    memberData
  };
};

/**
 * Fetch tier distribution statistics
 * @returns Tier distribution
 */
export const fetchTierDistribution = async (): Promise<TierDistribution> => {
  let tierDistribution: TierDistribution = {
    free: 0,
    privileged: 0,
    privileged_plus: 0
  };

  try {
    // Fetch all users with their membership tiers
    const { data, error } = await supabase
      .from('users')
      .select('membership_tier');

    if (error) {
      console.error('Error fetching user tiers:', error);
    } else if (data) {
      // Count users by tier manually
      data.forEach((user: { membership_tier?: string }) => {
        const tier = user.membership_tier;
        // Map membership tier to tier distribution keys
        if (tier === 'MEMBER') {
          tierDistribution.free++;
        } else if (tier === 'PRIVILEGED') {
          tierDistribution.privileged++;
        } else if (tier === 'PRIVILEGED_PLUS') {
          tierDistribution.privileged_plus++;
        } else {
          // Default to free tier if not specified
          tierDistribution.free++;
        }
      });
    }
  } catch (error) {
    console.error('Exception fetching tier distribution:', error);
  }

  return tierDistribution;
};

/**
 * Fetch all statistics for the admin dashboard
 * @param dateRanges Date ranges for filtering data
 * @returns All fetched statistics
 */
export const fetchAllStats = async (dateRanges: DateRanges): Promise<FetchedStats> => {
  try {
    // Initialize the service
    await initializeAdminStatsService();

    // Fetch all stats in parallel for better performance
    const [
      clubStats,
      userStats,
      discussionStats,
      memberStats,
      previousPeriodStats,
      tierDistribution
    ] = await Promise.all([
      fetchClubStats(dateRanges),
      fetchUserStats(dateRanges),
      fetchDiscussionStats(dateRanges),
      fetchMemberStats(),
      fetchPreviousPeriodStats(dateRanges),
      fetchTierDistribution()
    ]);

    // Combine all stats
    return {
      // Club stats
      totalClubs: clubStats.totalClubs,
      newClubsInRange: clubStats.newClubsInRange,
      clubsWithCurrentBook: clubStats.clubsWithCurrentBook,

      // User stats
      totalUsers: userStats.totalUsers,
      newUsersInRange: userStats.newUsersInRange,
      userCreationData: userStats.userCreationData,

      // Discussion stats
      totalDiscussions: discussionStats.totalDiscussions,
      activeDiscussions: discussionStats.activeDiscussions,

      // Member stats
      totalMembers: memberStats.totalMembers,
      pendingJoinRequests: memberStats.pendingJoinRequests,

      // Books in progress (same as clubs with current books)
      booksInProgress: clubStats.clubsWithCurrentBook,

      // Previous period stats
      previousPeriod: previousPeriodStats,

      // Recent activity
      recentActivity: {
        newUsers: userStats.recentNewUsers,
        newClubs: clubStats.recentNewClubs,
        newDiscussions: discussionStats.recentNewDiscussions
      },

      // Tier distribution
      tierDistribution
    };
  } catch (error) {
    console.error('Error fetching all stats:', error);
    throw error;
  }
};
