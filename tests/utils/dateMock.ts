import { vi, afterEach } from 'vitest';

/**
 * Mocks the Date object to return a fixed date
 * This helps ensure consistent date handling in tests
 * 
 * @param isoString ISO string representation of the fixed date (default: '2023-07-10T12:00:00Z')
 * @returns A cleanup function to restore the original Date behavior
 */
export const mockFixedDate = (isoString = '2023-07-10T12:00:00Z') => {
  const fixedDate = new Date(isoString);
  
  // Save original implementations
  const originalNow = Date.now;
  const originalDate = global.Date;
  
  // Mock Date.now to return the fixed timestamp
  vi.spyOn(Date, 'now').mockImplementation(() => fixedDate.getTime());
  
  // Mock the Date constructor to return the fixed date when called without arguments
  global.Date = class extends Date {
    constructor(...args: any[]) {
      if (args.length === 0) {
        return new originalDate(fixedDate);
      }
      return new originalDate(...args);
    }
  } as DateConstructor;
  
  // Return cleanup function to restore original Date behavior
  return () => {
    Date.now = originalNow;
    global.Date = originalDate;
  };
};

/**
 * Sets up a fixed date for the duration of a test
 * Automatically cleans up after the test
 * 
 * @param isoString ISO string representation of the fixed date
 */
export const useMockDate = (isoString = '2023-07-10T12:00:00Z') => {
  let cleanup: (() => void) | null = null;
  
  beforeEach(() => {
    cleanup = mockFixedDate(isoString);
  });
  
  afterEach(() => {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  });
};

/**
 * Creates a date that is a specific number of days in the future or past
 * Useful for creating test dates relative to the current date
 * 
 * @param days Number of days to add (positive) or subtract (negative)
 * @param fromDate Base date (defaults to current date)
 * @returns A new Date object
 */
export const createRelativeDate = (days: number, fromDate = new Date()) => {
  const date = new Date(fromDate);
  date.setDate(date.getDate() + days);
  return date;
};

/**
 * Creates an ISO string for a date that is a specific number of days in the future or past
 * 
 * @param days Number of days to add (positive) or subtract (negative)
 * @param fromDate Base date (defaults to current date)
 * @returns ISO string representation of the date
 */
export const createRelativeDateISOString = (days: number, fromDate = new Date()) => {
  return createRelativeDate(days, fromDate).toISOString();
};
