import { useState, useCallback } from 'react';
import { TimeRange } from '../types';

/**
 * Hook for managing time range filtering
 * @param initialTimeRange Initial time range value
 * @returns Time range state and setter function
 */
export const useTimeRangeFilter = (initialTimeRange: TimeRange = 'month') => {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);

  const handleTimeRangeChange = useCallback((newRange: TimeRange) => {
    console.log('useTimeRangeFilter - changing from', timeRange, 'to', newRange);
    setTimeRange(newRange);
  }, [timeRange]);

  return {
    timeRange,
    setTimeRange: handleTimeRangeChange
  };
};
