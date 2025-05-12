import { DashboardStats, TierDistribution } from '../types';

/**
 * Calculate the percentage of users in clubs
 * @param totalMembers Total number of unique members
 * @param totalUsers Total number of users
 * @returns Percentage of users in clubs
 */
export const calculateUsersInClubsPercentage = (totalMembers: number, totalUsers: number): string => {
  if (totalUsers === 0) return '0.0';
  return ((totalMembers / totalUsers) * 100).toFixed(1);
};

/**
 * Calculate the average members per club
 * @param totalMembers Total number of unique members
 * @param totalClubs Total number of clubs
 * @returns Average members per club
 */
export const calculateAvgMembersPerClub = (totalMembers: number, totalClubs: number): number => {
  if (totalClubs === 0) return 0;
  return Math.round((totalMembers / totalClubs) * 10) / 10;
};

/**
 * Calculate the average discussions per club
 * @param totalDiscussions Total number of discussions
 * @param totalClubs Total number of clubs
 * @returns Average discussions per club
 */
export const calculateAvgDiscussionsPerClub = (totalDiscussions: number, totalClubs: number): number => {
  if (totalClubs === 0) return 0;
  return Math.round((totalDiscussions / totalClubs) * 10) / 10;
};

/**
 * Calculate the percentage of clubs with current books
 * @param clubsWithCurrentBook Number of clubs with current books
 * @param totalClubs Total number of clubs
 * @returns Percentage of clubs with current books
 */
export const calculateClubsWithBooksPercentage = (clubsWithCurrentBook: number, totalClubs: number): string => {
  if (totalClubs === 0) return '0.0';
  return ((clubsWithCurrentBook / totalClubs) * 100).toFixed(1);
};

/**
 * Calculate the percentage for each tier
 * @param tierDistribution Tier distribution object
 * @param totalUsers Total number of users
 * @returns Object with percentages for each tier
 */
export const calculateTierPercentages = (
  tierDistribution: TierDistribution, 
  totalUsers: number
): { [key in keyof TierDistribution]: number } => {
  if (totalUsers === 0) {
    return {
      free: 0,
      privileged: 0,
      privileged_plus: 0
    };
  }

  return {
    free: Math.round((tierDistribution.free / totalUsers) * 100),
    privileged: Math.round((tierDistribution.privileged / totalUsers) * 100),
    privileged_plus: Math.round((tierDistribution.privileged_plus / totalUsers) * 100)
  };
};
