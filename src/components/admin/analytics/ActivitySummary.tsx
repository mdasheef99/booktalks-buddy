import React, { memo, useMemo } from 'react';
import { Activity } from 'lucide-react';
import { ActivityData } from '@/lib/analytics/types';
import AnalyticsSummaryCard from './AnalyticsSummaryCard';

interface ActivitySummaryProps {
  data: ActivityData[];
}

/**
 * Component for displaying activity summary
 */
const ActivitySummary: React.FC<ActivitySummaryProps> = ({ data }) => {
  // Calculate totals
  const totals = useMemo(() => {
    const totalDiscussions = data.reduce((sum, item) => sum + item.discussions, 0);
    const totalClubs = data.reduce((sum, item) => sum + item.clubs, 0);
    const discussionsPerClub = totalClubs > 0 
      ? (totalDiscussions / totalClubs).toFixed(1) 
      : '0.0';
    
    return {
      totalDiscussions,
      totalClubs,
      discussionsPerClub
    };
  }, [data]);

  return (
    <AnalyticsSummaryCard title="Activity Overview" icon={<Activity className="h-5 w-5" />}>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Total Discussions:</span>
          <span>{totals.totalDiscussions}</span>
        </div>
        <div className="flex justify-between">
          <span>Total Clubs:</span>
          <span>{totals.totalClubs}</span>
        </div>
        <div className="flex justify-between">
          <span>Discussions per Club:</span>
          <span>{totals.discussionsPerClub}</span>
        </div>
      </div>
    </AnalyticsSummaryCard>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(ActivitySummary);
