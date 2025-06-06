/**
 * Activity Display Hook
 * Custom hook for managing activity display logic
 */

import { useMemo } from 'react';
import type { ActivityFeedItem } from '@/lib/api/store/types/communityShowcaseTypes';
import type { 
  CommunityShowcaseSettings,
  UseActivityDisplayResult 
} from '../types/metricsConfigTypes';
import { 
  getDisplayedActivities, 
  getActivityCount 
} from '../utils/metricsConfigUtils';

/**
 * Custom hook for activity display management
 */
export const useActivityDisplay = (
  activities: ActivityFeedItem[],
  settings: CommunityShowcaseSettings
): UseActivityDisplayResult => {
  
  const displayResult = useMemo(() => {
    const { displayed, hasMore } = getDisplayedActivities(
      activities, 
      settings.activity_feed_limit
    );
    
    const activityCount = getActivityCount(activities, settings.activity_feed_limit);
    
    return {
      displayedActivities: displayed,
      hasMoreActivities: hasMore,
      activityCount
    };
  }, [activities, settings.activity_feed_limit]);

  return displayResult;
};

/**
 * Hook for activity filtering and sorting
 */
export const useActivityFiltering = (activities: ActivityFeedItem[]) => {
  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [activities]);

  const filterByType = useMemo(() => {
    return (type: string) => {
      return sortedActivities.filter(activity => activity.type === type);
    };
  }, [sortedActivities]);

  const getRecentActivities = useMemo(() => {
    return (hours: number = 24) => {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - hours);
      
      return sortedActivities.filter(activity => 
        new Date(activity.created_at) > cutoff
      );
    };
  }, [sortedActivities]);

  return {
    sortedActivities,
    filterByType,
    getRecentActivities,
  };
};
