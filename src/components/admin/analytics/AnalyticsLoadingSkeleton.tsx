import React, { memo } from 'react';

/**
 * Loading skeleton for the analytics page
 */
const AnalyticsLoadingSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-64 bg-gray-300 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="h-32 bg-gray-300 rounded"></div>
        <div className="h-32 bg-gray-300 rounded"></div>
        <div className="h-32 bg-gray-300 rounded"></div>
      </div>
      <div className="h-64 bg-gray-300 rounded"></div>
      <div className="h-64 bg-gray-300 rounded"></div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(AnalyticsLoadingSkeleton);
