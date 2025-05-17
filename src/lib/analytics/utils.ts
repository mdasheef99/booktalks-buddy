/**
 * Utility functions for analytics
 */

/**
 * Format a month string (YYYY-MM) for display
 * @param dateStr Month string in YYYY-MM format
 * @returns Formatted month string (e.g., "Jan 2023")
 */
export const formatMonth = (dateStr: string): string => {
  const [year, month] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

/**
 * Calculate the time limit date based on the selected time range
 * @param timeRange Selected time range
 * @returns Date object representing the time limit
 */
export const calculateTimeLimit = (timeRange: '6months' | '12months' | 'all'): Date => {
  const timeLimit = new Date();
  
  if (timeRange === '6months') {
    timeLimit.setMonth(timeLimit.getMonth() - 6);
  } else if (timeRange === '12months') {
    timeLimit.setMonth(timeLimit.getMonth() - 12);
  } else {
    // For 'all', set to a very old date
    return new Date(2000, 0, 1);
  }
  
  return timeLimit;
};

/**
 * Format a date as YYYY-MM
 * @param date Date object
 * @returns Formatted date string (YYYY-MM)
 */
export const formatDateAsYearMonth = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Calculate percentage with proper rounding
 * @param value Numerator
 * @param total Denominator
 * @returns Rounded percentage
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};
