/**
 * Metrics Formatting Hook
 * Custom hook for formatting metrics and activity data
 */

import { useCallback, useMemo } from 'react';
import type { ActivityFeedItem } from '@/lib/api/store/types/communityShowcaseTypes';
import type { UseMetricsFormattingResult } from '../types/metricsConfigTypes';
import { 
  formatValue, 
  formatTimeAgo, 
  formatActivities 
} from '../utils/metricsConfigUtils';

/**
 * Custom hook for metrics and activity formatting
 */
export const useMetricsFormatting = (): UseMetricsFormattingResult => {
  const formatValueCallback = useCallback((num: number): string => {
    return formatValue(num);
  }, []);

  const formatTimeAgoCallback = useCallback((dateString: string): string => {
    return formatTimeAgo(dateString);
  }, []);

  const formatActivitiesCallback = useCallback((activities: ActivityFeedItem[]) => {
    return formatActivities(activities);
  }, []);

  return {
    formatValue: formatValueCallback,
    formatTimeAgo: formatTimeAgoCallback,
    formatActivities: formatActivitiesCallback,
  };
};

/**
 * Hook for memoized activity formatting
 */
export const useFormattedActivities = (activities: ActivityFeedItem[]) => {
  return useMemo(() => {
    return formatActivities(activities);
  }, [activities]);
};
