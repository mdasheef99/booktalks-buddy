import React from 'react';
import { Users, BookOpen, MessageSquare } from 'lucide-react';
import EnhancedStatsCard from './EnhancedStatsCard';
import UserStatsCard from './UserStatsCard';
import { MainStatsRowProps, TrendDirection } from '../types';

/**
 * Component for the main statistics row
 */
const MainStatsRow: React.FC<MainStatsRowProps> = ({ stats, timeRange }) => {
  // Calculate percentage of users in clubs safely
  const calculatePercentage = () => {
    if (!stats.totalUsers || stats.totalUsers === 0 || !stats.totalMembers) {
      return '0.0';
    }
    return ((stats.totalMembers / stats.totalUsers) * 100).toFixed(1);
  };

  // Determine trend direction based on growth rate
  const getTrendDirection = (growthRate?: number): TrendDirection => {
    if (!growthRate) return 'neutral';
    return growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'neutral';
  };

  // Format growth rate for display
  const formatGrowthRate = (growthRate?: number): string => {
    if (!growthRate) return '0%';
    return `${growthRate > 0 ? '+' : ''}${growthRate.toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Enhanced User Stats Card */}
      <UserStatsCard stats={stats} />

      {/* Book Clubs Card */}
      <EnhancedStatsCard
        title="Book Clubs"
        value={stats.totalClubs !== undefined ? stats.totalClubs : 'Loading...'}
        icon={<BookOpen className="h-8 w-8" />}
        secondaryText={`${stats.newClubsInRange || 0} new in selected period`}
        trend={stats.growthRates?.clubs !== undefined ? {
          direction: getTrendDirection(stats.growthRates.clubs),
          value: formatGrowthRate(stats.growthRates.clubs),
          label: 'from previous period'
        } : undefined}
        progressBar={stats.totalClubs > 0 ? {
          value: stats.newClubsInRange || 0,
          max: stats.totalClubs,
          label: 'New clubs as % of total'
        } : undefined}
      />

      {/* Discussions Card */}
      <EnhancedStatsCard
        title="Discussions"
        value={stats.totalDiscussions !== undefined ? stats.totalDiscussions : 'Loading...'}
        icon={<MessageSquare className="h-8 w-8" />}
        secondaryText={`${stats.activeDiscussions || 0} active in selected period`}
        trend={stats.growthRates?.discussions !== undefined ? {
          direction: getTrendDirection(stats.growthRates.discussions),
          value: formatGrowthRate(stats.growthRates.discussions),
          label: 'from previous period'
        } : undefined}
      />

      {/* Club Members Card */}
      <EnhancedStatsCard
        title="Club Members"
        value={stats.totalMembers !== undefined ? stats.totalMembers : 'Loading...'}
        icon={<Users className="h-8 w-8" />}
        secondaryText={`${calculatePercentage()}% of users are in clubs`}
        progressBar={stats.totalUsers > 0 ? {
          value: stats.totalMembers || 0,
          max: stats.totalUsers,
          label: 'Members as % of total users'
        } : undefined}
      />
    </div>
  );
};

export default MainStatsRow;
