import React from 'react';

/**
 * Loading skeleton for the dashboard
 */
const LoadingDashboard: React.FC = () => {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-64 bg-gray-300 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="h-32 bg-gray-300 rounded"></div>
        <div className="h-32 bg-gray-300 rounded"></div>
        <div className="h-32 bg-gray-300 rounded"></div>
        <div className="h-32 bg-gray-300 rounded"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="h-32 bg-gray-300 rounded"></div>
        <div className="h-32 bg-gray-300 rounded"></div>
        <div className="h-32 bg-gray-300 rounded"></div>
        <div className="h-32 bg-gray-300 rounded"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64 bg-gray-300 rounded"></div>
        <div className="h-64 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
};

export default LoadingDashboard;
