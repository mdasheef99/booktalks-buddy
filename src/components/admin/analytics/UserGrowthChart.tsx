import React, { memo, useMemo } from 'react';
import { UserGrowthData } from '@/lib/analytics/types';
import { formatMonth } from '@/lib/analytics/utils';

interface UserGrowthChartProps {
  data: UserGrowthData[];
}

/**
 * Component for rendering the user growth chart
 */
const UserGrowthChart: React.FC<UserGrowthChartProps> = ({ data }) => {
  // Calculate max values for scaling
  const maxValues = useMemo(() => {
    if (data.length === 0) return { maxCount: 0, maxNewUsers: 0 };
    
    return {
      maxCount: Math.max(...data.map(d => d.count)),
      maxNewUsers: Math.max(...data.map(d => d.newUsers))
    };
  }, [data]);

  if (data.length === 0) {
    return <p className="text-center text-muted-foreground">No user data available</p>;
  }

  return (
    <div className="mt-6">
      <div className="flex justify-end mb-4">
        <div className="flex items-center space-x-2 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-bookconnect-terracotta rounded-full mr-1"></div>
            <span>Total Users</span>
          </div>
          <div className="flex items-center ml-4">
            <div className="w-3 h-3 bg-bookconnect-sage rounded-full mr-1"></div>
            <span>New Users</span>
          </div>
        </div>
      </div>

      <div className="h-64 flex items-end space-x-1 relative border-b border-l border-gray-200 pt-5">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 -ml-6">
          <span>0</span>
          <span>{Math.floor(maxValues.maxCount / 2)}</span>
          <span>{maxValues.maxCount}</span>
        </div>

        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center group relative" style={{ flex: '1' }}>
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 bg-white shadow-lg rounded p-2 text-xs hidden group-hover:block z-10 w-36">
              <p className="font-semibold">{formatMonth(item.date)}</p>
              <p>Total Users: {item.count}</p>
              <p>New Users: {item.newUsers}</p>
            </div>

            {/* New users bar */}
            <div
              className="bg-bookconnect-sage w-full rounded-t-sm transition-all duration-500 opacity-80"
              style={{
                height: `${(item.newUsers / maxValues.maxCount) * 100}%`,
                minHeight: item.newUsers > 0 ? '4px' : '0'
              }}
            ></div>

            {/* Total users bar */}
            <div
              className="bg-bookconnect-terracotta w-full rounded-t-sm transition-all duration-500"
              style={{
                height: `${(item.count / maxValues.maxCount) * 100}%`,
                minHeight: '4px',
                opacity: 0.2
              }}
            ></div>

            {/* X-axis label - only show every other month for readability */}
            {index % 2 === 0 && (
              <div className="text-xs mt-2 -rotate-45 origin-top-left text-gray-500">
                {formatMonth(item.date)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(UserGrowthChart);
