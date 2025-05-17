import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { TimeRange } from '@/lib/analytics/types';

interface TimeRangeSelectorProps {
  timeRange: TimeRange;
  onTimeRangeChange: (timeRange: TimeRange) => void;
}

/**
 * Component for selecting the time range for analytics data
 */
const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  timeRange,
  onTimeRangeChange
}) => {
  return (
    <div className="flex justify-end mb-4">
      <div className="inline-flex items-center rounded-md border border-input bg-background p-1">
        <Button
          variant={timeRange === '6months' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onTimeRangeChange('6months')}
          className="text-xs"
        >
          6 Months
        </Button>
        <Button
          variant={timeRange === '12months' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onTimeRangeChange('12months')}
          className="text-xs"
        >
          12 Months
        </Button>
        <Button
          variant={timeRange === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onTimeRangeChange('all')}
          className="text-xs"
        >
          All Time
        </Button>
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(TimeRangeSelector);
