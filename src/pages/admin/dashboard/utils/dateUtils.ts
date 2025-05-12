import { TimeRange } from '../types';

/**
 * Calculate the start date based on the selected time range
 * @param timeRange The selected time range
 * @returns The start date for the selected time range
 */
export const getTimeRangeStartDate = (timeRange: TimeRange): Date => {
  const now = new Date();
  let rangeStartDate = new Date();

  console.log(`Calculating start date for time range: ${timeRange}`);

  switch(timeRange) {
    case 'today':
      rangeStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      console.log(`Today's date: ${rangeStartDate.toDateString()}`);
      break;
    case 'week':
      rangeStartDate = new Date(now);
      rangeStartDate.setDate(now.getDate() - 7);
      console.log(`Week start date: ${rangeStartDate.toDateString()}`);
      break;
    case 'month':
      rangeStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
      console.log(`Month start date: ${rangeStartDate.toDateString()}`);
      break;
    case 'quarter':
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      rangeStartDate = new Date(now.getFullYear(), quarterStartMonth, 1);
      console.log(`Quarter start date: ${rangeStartDate.toDateString()}`);
      break;
    case 'halfyear':
      const halfYearStartMonth = Math.floor(now.getMonth() / 6) * 6;
      rangeStartDate = new Date(now.getFullYear(), halfYearStartMonth, 1);
      console.log(`Half year start date: ${rangeStartDate.toDateString()}`);
      break;
    case 'year':
      rangeStartDate = new Date(now.getFullYear(), 0, 1);
      console.log(`Year start date: ${rangeStartDate.toDateString()}`);
      break;
    case 'all':
      rangeStartDate = new Date(2000, 0, 1); // Far in the past to get all data
      console.log(`All time start date: ${rangeStartDate.toDateString()}`);
      break;
  }

  return rangeStartDate;
};

/**
 * Get the start date for recent activity (last 7 days)
 * @returns The start date for recent activity
 */
export const getRecentActivityStartDate = (): Date => {
  const now = new Date();
  const recentActivityStart = new Date();
  recentActivityStart.setDate(now.getDate() - 7);
  return recentActivityStart;
};

/**
 * Format a date to ISO string for Supabase queries
 * @param date The date to format
 * @returns The formatted date string
 */
export const formatDateForQuery = (date: Date): string => {
  // Format as ISO string and log for debugging
  const formattedDate = date.toISOString();
  console.log(`Formatting date ${date.toString()} to ${formattedDate} for query`);
  return formattedDate;
};

/**
 * Get a human-readable description of the time range
 * @param timeRange The time range
 * @returns A human-readable description
 */
export const getTimeRangeDescription = (timeRange: TimeRange): string => {
  switch(timeRange) {
    case 'today':
      return 'today';
    case 'week':
      return 'this week';
    case 'month':
      return 'this month';
    case 'quarter':
      return 'this quarter';
    case 'halfyear':
      return 'this half year';
    case 'year':
      return 'this year';
    case 'all':
      return 'all time';
    default:
      return '';
  }
};
