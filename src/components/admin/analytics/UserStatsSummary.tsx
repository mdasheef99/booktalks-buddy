import React, { memo } from 'react';
import { Users } from 'lucide-react';
import { UserStats } from '@/lib/analytics/types';
import { calculatePercentage } from '@/lib/analytics/utils';
import AnalyticsSummaryCard from './AnalyticsSummaryCard';

interface UserStatsSummaryProps {
  stats: UserStats;
}

/**
 * Component for displaying user statistics summary
 */
const UserStatsSummary: React.FC<UserStatsSummaryProps> = ({ stats }) => {
  const { totalUsers, activeUsers, usersByTier } = stats;
  const activePercentage = calculatePercentage(activeUsers, totalUsers);

  return (
    <AnalyticsSummaryCard title="Total Users" icon={<Users className="h-5 w-5" />}>
      <div className="flex items-center justify-between">
        <div className="text-3xl font-bold">{totalUsers}</div>
        <Users className="h-8 w-8 text-bookconnect-terracotta opacity-80" />
      </div>
      <div className="text-sm text-muted-foreground mt-2">
        Estimated active: {activeUsers} ({activePercentage}%)
      </div>
    </AnalyticsSummaryCard>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(UserStatsSummary);
