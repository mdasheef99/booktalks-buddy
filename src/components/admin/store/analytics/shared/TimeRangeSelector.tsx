import React from 'react';

interface TimeRangeSelectorProps {
  value: number;
  onChange: (value: number) => void;
  options?: Array<{ value: number; label: string }>;
  className?: string;
}

/**
 * Reusable time range selector for analytics pages
 * Provides consistent styling and common time range options
 */
export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
  options = [
    { value: 7, label: 'Last 7 days' },
    { value: 30, label: 'Last 30 days' },
    { value: 90, label: 'Last 90 days' }
  ],
  className = "px-3 py-2 border border-gray-300 rounded-md text-sm"
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={className}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};
