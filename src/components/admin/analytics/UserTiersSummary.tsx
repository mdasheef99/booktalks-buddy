import React, { memo } from 'react';
import { TrendingUp } from 'lucide-react';
import { UserStats } from '@/lib/analytics/types';
import { calculatePercentage } from '@/lib/analytics/utils';
import AnalyticsSummaryCard from './AnalyticsSummaryCard';

interface UserTiersSummaryProps {
  stats: UserStats;
}

/**
 * Component for displaying user tiers summary
 */
const UserTiersSummary: React.FC<UserTiersSummaryProps> = ({ stats }) => {
  const { totalUsers, usersByTier } = stats;

  return (
    <AnalyticsSummaryCard title="User Tiers" icon={<TrendingUp className="h-5 w-5" />}>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Free:</span>
          <span>
            {usersByTier.free} ({calculatePercentage(usersByTier.free, totalUsers)}%)
          </span>
        </div>
        <div className="flex justify-between">
          <span>Privileged:</span>
          <span>
            {usersByTier.privileged} ({calculatePercentage(usersByTier.privileged, totalUsers)}%)
          </span>
        </div>
        <div className="flex justify-between">
          <span>Privileged+:</span>
          <span>
            {usersByTier.privileged_plus} ({calculatePercentage(usersByTier.privileged_plus, totalUsers)}%)
          </span>
        </div>
      </div>
    </AnalyticsSummaryCard>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(UserTiersSummary);
