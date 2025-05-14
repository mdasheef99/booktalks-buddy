import { DashboardStats } from '../types';
import {
  calculateAvgMembersPerClub,
  calculateAvgDiscussionsPerClub
} from './statsCalculations';
import {
  calculateGrowthRate,
  calculateAveragePerWeek,
  calculateAveragePerMonth,
  generateTrendData
} from './growthCalculations';

/**
 * Interface for raw fetched statistics
 */
interface RawStats {
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
  previousPeriod: {
    newUsers: number;
    newClubs: number;
    activeDiscussions: number;
  };
  recentActivity: {
    newUsers: number;
    newClubs: number;
    newDiscussions: number;
  };
  tierDistribution: {
    free: number;
    privileged: number;
    privileged_plus: number;
  };
  userCreationData: Array<{ created_at: string; count?: number }>;
}

/**
 * Process raw statistics and calculate derived metrics
 * @param rawStats Raw statistics from the database
 * @param rangeStartDate Start date of the selected time range
 * @returns Processed dashboard statistics
 */
export const processStats = (
  rawStats: RawStats,
  rangeStartDate: Date
): DashboardStats => {
  // Calculate averages
  const avgMembersPerClub = calculateAvgMembersPerClub(
    rawStats.totalMembers,
    rawStats.totalClubs
  );
  
  const avgDiscussionsPerClub = calculateAvgDiscussionsPerClub(
    rawStats.totalDiscussions,
    rawStats.totalClubs
  );
  
  // Calculate growth rates
  const userGrowthRate = calculateGrowthRate(
    rawStats.newUsersInRange,
    rawStats.previousPeriod.newUsers
  );
  
  const clubGrowthRate = calculateGrowthRate(
    rawStats.newClubsInRange,
    rawStats.previousPeriod.newClubs
  );
  
  const discussionGrowthRate = calculateGrowthRate(
    rawStats.activeDiscussions,
    rawStats.previousPeriod.activeDiscussions
  );
  
  // Calculate user acquisition metrics
  const daysSinceStart = Math.max(
    1,
    (new Date().getTime() - rangeStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const avgUsersPerWeek = calculateAveragePerWeek(
    rawStats.newUsersInRange,
    daysSinceStart
  );
  
  const avgUsersPerMonth = calculateAveragePerMonth(
    rawStats.newUsersInRange,
    daysSinceStart
  );
  
  // Generate trend data for user growth
  const userTrend = generateTrendData(
    rangeStartDate,
    new Date(),
    rawStats.userCreationData,
    6
  );
  
  // Return processed stats
  return {
    // Basic stats
    totalClubs: rawStats.totalClubs,
    totalMembers: rawStats.totalMembers,
    totalDiscussions: rawStats.totalDiscussions,
    totalUsers: rawStats.totalUsers,
    newUsersInRange: rawStats.newUsersInRange,
    newClubsInRange: rawStats.newClubsInRange,
    clubsWithCurrentBook: rawStats.clubsWithCurrentBook,
    pendingJoinRequests: rawStats.pendingJoinRequests,
    activeDiscussions: rawStats.activeDiscussions,
    booksInProgress: rawStats.booksInProgress,
    
    // Calculated averages
    avgMembersPerClub,
    avgDiscussionsPerClub,
    
    // Previous period stats
    previousPeriod: rawStats.previousPeriod,
    
    // Growth rates
    growthRates: {
      users: userGrowthRate,
      clubs: clubGrowthRate,
      discussions: discussionGrowthRate
    },
    
    // User acquisition metrics
    userAcquisition: {
      averagePerWeek: avgUsersPerWeek,
      averagePerMonth: avgUsersPerMonth,
      trend: userTrend
    },
    
    // Recent activity
    recentActivity: rawStats.recentActivity,
    
    // Tier distribution
    tierDistribution: rawStats.tierDistribution,
    
    // Timestamp
    lastUpdated: new Date().toISOString()
  };
};
