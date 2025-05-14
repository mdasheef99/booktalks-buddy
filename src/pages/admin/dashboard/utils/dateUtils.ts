import { TimeRange } from '../types';

/**
 * Calculate the start date based on the selected time range
 * @param timeRange The selected time range
 * @returns The start date for the selected time range
 */
export const getTimeRangeStartDate = (timeRange: TimeRange): Date => {
  try {
    const now = new Date();
    let rangeStartDate = new Date();

    // Validate the current date
    if (isNaN(now.getTime())) {
      console.error('Invalid current date in getTimeRangeStartDate');
      return new Date(2000, 0, 1); // Return a fallback date
    }

    switch(timeRange) {
      case 'today':
        rangeStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        rangeStartDate = new Date(now);
        rangeStartDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        rangeStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
        rangeStartDate = new Date(now.getFullYear(), quarterStartMonth, 1);
        break;
      case 'halfyear':
        const halfYearStartMonth = Math.floor(now.getMonth() / 6) * 6;
        rangeStartDate = new Date(now.getFullYear(), halfYearStartMonth, 1);
        break;
      case 'year':
        rangeStartDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
        rangeStartDate = new Date(2000, 0, 1); // Far in the past to get all data
        break;
      default:
        // Default to month if an invalid time range is provided
        console.error(`Invalid time range: ${timeRange}, defaulting to month`);
        rangeStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Validate the calculated date
    if (isNaN(rangeStartDate.getTime())) {
      console.error('Invalid calculated date in getTimeRangeStartDate');
      return new Date(2000, 0, 1); // Return a fallback date
    }

    return rangeStartDate;
  } catch (error) {
    console.error('Error in getTimeRangeStartDate:', error);
    return new Date(2000, 0, 1); // Return a fallback date
  }
};

/**
 * Get the start date for recent activity (last 7 days)
 * @returns The start date for recent activity
 */
export const getRecentActivityStartDate = (): Date => {
  try {
    const now = new Date();

    // Validate the current date
    if (isNaN(now.getTime())) {
      console.error('Invalid current date in getRecentActivityStartDate');
      return new Date(2000, 0, 1); // Return a fallback date
    }

    const recentActivityStart = new Date(now);
    recentActivityStart.setDate(now.getDate() - 7);

    // Validate the calculated date
    if (isNaN(recentActivityStart.getTime())) {
      console.error('Invalid calculated date in getRecentActivityStartDate');
      return new Date(2000, 0, 1); // Return a fallback date
    }

    return recentActivityStart;
  } catch (error) {
    console.error('Error in getRecentActivityStartDate:', error);
    return new Date(2000, 0, 1); // Return a fallback date
  }
};

/**
 * Format a date to ISO string for Supabase queries
 * @param date The date to format
 * @returns The formatted date string
 */
export const formatDateForQuery = (date: Date): string => {
  try {
    // Ensure the date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date provided to formatDateForQuery:', date);
      // Return a fallback date far in the past to avoid filtering out data
      return new Date(2000, 0, 1).toISOString();
    }

    // Format as ISO string
    return date.toISOString();
  } catch (error) {
    console.error('Error formatting date for query:', error);
    // Return a fallback date far in the past to avoid filtering out data
    return new Date(2000, 0, 1).toISOString();
  }
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

/**
 * Calculate the start date for the previous period based on the current time range
 * @param timeRange The current time range
 * @param currentRangeStartDate The start date of the current time range
 * @returns The start date for the previous period
 */
export const getPreviousPeriodStartDate = (timeRange: TimeRange, currentRangeStartDate: Date): Date => {
  try {
    const now = new Date();
    let previousPeriodStartDate = new Date(currentRangeStartDate);

    // Validate inputs
    if (isNaN(now.getTime()) || isNaN(currentRangeStartDate.getTime())) {
      console.error('Invalid date in getPreviousPeriodStartDate');
      return new Date(2000, 0, 1); // Return a fallback date
    }

    switch(timeRange) {
      case 'today':
        // Previous day
        previousPeriodStartDate.setDate(previousPeriodStartDate.getDate() - 1);
        break;
      case 'week':
        // Previous week
        previousPeriodStartDate.setDate(previousPeriodStartDate.getDate() - 7);
        break;
      case 'month':
        // Previous month
        previousPeriodStartDate.setMonth(previousPeriodStartDate.getMonth() - 1);
        break;
      case 'quarter':
        // Previous quarter (3 months)
        previousPeriodStartDate.setMonth(previousPeriodStartDate.getMonth() - 3);
        break;
      case 'halfyear':
        // Previous half year (6 months)
        previousPeriodStartDate.setMonth(previousPeriodStartDate.getMonth() - 6);
        break;
      case 'year':
        // Previous year
        previousPeriodStartDate.setFullYear(previousPeriodStartDate.getFullYear() - 1);
        break;
      case 'all':
        // For 'all', use a period of 5 years before the current range
        previousPeriodStartDate = new Date(2000, 0, 1);
        break;
      default:
        // Default to previous month
        previousPeriodStartDate.setMonth(previousPeriodStartDate.getMonth() - 1);
    }

    // Validate the calculated date
    if (isNaN(previousPeriodStartDate.getTime())) {
      console.error('Invalid calculated date in getPreviousPeriodStartDate');
      return new Date(2000, 0, 1); // Return a fallback date
    }

    return previousPeriodStartDate;
  } catch (error) {
    console.error('Error in getPreviousPeriodStartDate:', error);
    return new Date(2000, 0, 1); // Return a fallback date
  }
};

/**
 * Calculate the end date for a period based on its start date and the time range
 * @param startDate The start date of the period
 * @param timeRange The time range
 * @returns The end date for the period
 */
export const getPeriodEndDate = (startDate: Date, timeRange: TimeRange): Date => {
  try {
    const now = new Date();
    let endDate = new Date(startDate);

    // Validate input
    if (isNaN(startDate.getTime())) {
      console.error('Invalid date in getPeriodEndDate');
      return now; // Return current date as fallback
    }

    switch(timeRange) {
      case 'today':
        // End of day
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        // 7 days from start
        endDate.setDate(endDate.getDate() + 7);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        // End of month
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // Last day of the month
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'quarter':
        // End of quarter
        endDate.setMonth(endDate.getMonth() + 3);
        endDate.setDate(0); // Last day of the month
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'halfyear':
        // End of half year
        endDate.setMonth(endDate.getMonth() + 6);
        endDate.setDate(0); // Last day of the month
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'year':
        // End of year
        endDate.setFullYear(endDate.getFullYear() + 1);
        endDate.setDate(0); // Last day of the month
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'all':
        // For 'all', use current date
        endDate = now;
        break;
      default:
        // Default to current date
        endDate = now;
    }

    // Ensure end date is not in the future
    if (endDate > now) {
      endDate = now;
    }

    // Validate the calculated date
    if (isNaN(endDate.getTime())) {
      console.error('Invalid calculated date in getPeriodEndDate');
      return now; // Return current date as fallback
    }

    return endDate;
  } catch (error) {
    console.error('Error in getPeriodEndDate:', error);
    return new Date(); // Return current date as fallback
  }
};
