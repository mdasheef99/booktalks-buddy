import React from 'react';
import { Button } from '@/components/ui/button';
import { TimeRangeFilterProps, TimeRange } from '../types';

/**
 * Component for selecting time range filters
 */
const TimeRangeFilter: React.FC<TimeRangeFilterProps> = ({
  timeRange,
  onTimeRangeChange
}) => {
  // Time range options
  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'halfyear', label: 'Half Year' },
    { value: 'year', label: 'Year' },
    { value: 'all', label: 'All Time' }
  ];

  return (
    <div className="inline-flex items-center rounded-md border border-input bg-background p-1">
      {timeRangeOptions.map((option) => (
        <Button
          key={option.value}
          variant={timeRange === option.value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onTimeRangeChange(option.value)}
          className="text-xs"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
};

export default TimeRangeFilter;
