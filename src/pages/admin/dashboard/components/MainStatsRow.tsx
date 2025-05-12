import React from 'react';
import { Users, BookOpen, MessageSquare } from 'lucide-react';
import StatsCard from './StatsCard';
import { MainStatsRowProps } from '../types';

/**
 * Component for the main statistics row
 */
const MainStatsRow: React.FC<MainStatsRowProps> = ({ stats, timeRange }) => {
  console.log('MainStatsRow rendering with stats:', stats);
  console.log('Time-sensitive stats values:', {
    newUsersInRange: stats.newUsersInRange,
    newClubsInRange: stats.newClubsInRange,
    activeDiscussions: stats.activeDiscussions
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Users Card */}
      <StatsCard
        title="Total Users"
        value={stats.totalUsers !== undefined ? stats.totalUsers : 'Loading...'}
        icon={<Users className="h-8 w-8" />}
        secondaryText={`${stats.newUsersInRange} new in selected period`}
      />

      {/* Debug Card */}
      <StatsCard
        title="Debug Card"
        value={42}
        icon={<Users className="h-8 w-8" />}
        secondaryText={`Current time range: ${timeRange || 'unknown'}`}
      />

      {/* Book Clubs Card */}
      <StatsCard
        title="Book Clubs"
        value={stats.totalClubs}
        icon={<BookOpen className="h-8 w-8" />}
        secondaryText={`${stats.newClubsInRange} new in selected period`}
      />

      {/* Discussions Card */}
      <StatsCard
        title="Discussions"
        value={stats.totalDiscussions}
        icon={<MessageSquare className="h-8 w-8" />}
        secondaryText={`${stats.activeDiscussions} active in selected period`}
      />

      {/* Club Members Card */}
      <StatsCard
        title="Club Members"
        value={stats.totalMembers}
        icon={<Users className="h-8 w-8" />}
        secondaryText={`${((stats.totalMembers / stats.totalUsers) * 100).toFixed(1)}% of users are in clubs`}
      />
    </div>
  );
};

export default MainStatsRow;
