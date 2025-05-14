/**
 * Calculate growth rate between current and previous values
 * @param current Current period value
 * @param previous Previous period value
 * @returns Growth rate as a percentage
 */
export const calculateGrowthRate = (current: number, previous: number): number => {
  // If both are 0, there's no growth
  if (current === 0 && previous === 0) return 0;
  
  // If previous is 0 but current is not, it's infinite growth, cap at 100%
  if (previous === 0 && current > 0) return 100;
  
  // Calculate percentage change
  return ((current - previous) / previous) * 100;
};

/**
 * Calculate average per week based on total count and days
 * @param total Total count
 * @param days Number of days
 * @returns Average per week
 */
export const calculateAveragePerWeek = (total: number, days: number): number => {
  if (days <= 0) return 0;
  return (total / days) * 7; // Convert to weekly average
};

/**
 * Calculate average per month based on total count and days
 * @param total Total count
 * @param days Number of days
 * @returns Average per month
 */
export const calculateAveragePerMonth = (total: number, days: number): number => {
  if (days <= 0) return 0;
  return (total / days) * 30; // Approximate month as 30 days
};

/**
 * Generate trend data for sparkline visualization
 * @param timeRangeStartDate Start date of the time range
 * @param data Array of objects with created_at and count properties
 * @param segments Number of segments to divide the time range into
 * @returns Array of counts for each segment
 */
export const generateTrendData = (
  timeRangeStartDate: Date,
  currentDate: Date,
  data: Array<{ created_at: string; count?: number }>,
  segments: number = 6
): number[] => {
  // Initialize result array with zeros
  const result: number[] = Array(segments).fill(0);
  
  // Calculate time range in milliseconds
  const startTime = timeRangeStartDate.getTime();
  const endTime = currentDate.getTime();
  const timeRange = endTime - startTime;
  
  // If time range is invalid or too small, return empty trend
  if (timeRange <= 0) return result;
  
  // Calculate segment duration
  const segmentDuration = timeRange / segments;
  
  // Process each data point
  data.forEach(item => {
    const itemTime = new Date(item.created_at).getTime();
    
    // Skip invalid dates or dates outside our range
    if (isNaN(itemTime) || itemTime < startTime || itemTime > endTime) return;
    
    // Calculate which segment this item belongs to
    const segmentIndex = Math.min(
      Math.floor((itemTime - startTime) / segmentDuration),
      segments - 1
    );
    
    // Add count to the appropriate segment
    result[segmentIndex] += item.count || 1;
  });
  
  return result;
};
