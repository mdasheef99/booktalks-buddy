import React, { memo, useMemo } from 'react';
import { ActivityData } from '@/lib/analytics/types';
import { formatMonth } from '@/lib/analytics/utils';

interface ActivityChartProps {
  data: ActivityData[];
}

/**
 * Component for rendering the platform activity chart
 */
const ActivityChart: React.FC<ActivityChartProps> = ({ data }) => {
  // Calculate max values for scaling
  const maxValue = useMemo(() => {
    if (data.length === 0) return 0;
    
    const maxDiscussions = Math.max(...data.map(d => d.discussions));
    const maxClubs = Math.max(...data.map(d => d.clubs));
    return Math.max(maxDiscussions, maxClubs);
  }, [data]);

  if (data.length === 0) {
    return <p className="text-center text-muted-foreground">No activity data available</p>;
  }

  return (
    <div className="mt-6">
      <div className="flex justify-end mb-4">
        <div className="flex items-center space-x-2 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-bookconnect-brown rounded-full mr-1"></div>
            <span>New Discussions</span>
          </div>
          <div className="flex items-center ml-4">
            <div className="w-3 h-3 bg-bookconnect-terracotta rounded-full mr-1"></div>
            <span>New Clubs</span>
          </div>
        </div>
      </div>

      <div className="h-64 flex items-end space-x-1 relative border-b border-l border-gray-200 pt-5">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 -ml-6">
          <span>0</span>
          <span>{Math.floor(maxValue / 2)}</span>
          <span>{maxValue}</span>
        </div>

        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center group relative" style={{ flex: '1' }}>
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 bg-white shadow-lg rounded p-2 text-xs hidden group-hover:block z-10 w-36">
              <p className="font-semibold">{formatMonth(item.month)}</p>
              <p>New Discussions: {item.discussions}</p>
              <p>New Clubs: {item.clubs}</p>
            </div>

            <div className="flex w-full h-full items-end">
              {/* Discussions bar */}
              <div
                className="bg-bookconnect-brown w-1/2 rounded-t-sm transition-all duration-500 mr-px"
                style={{
                  height: `${(item.discussions / maxValue) * 100}%`,
                  minHeight: item.discussions > 0 ? '4px' : '0'
                }}
              ></div>

              {/* Clubs bar */}
              <div
                className="bg-bookconnect-terracotta w-1/2 rounded-t-sm transition-all duration-500"
                style={{
                  height: `${(item.clubs / maxValue) * 100}%`,
                  minHeight: item.clubs > 0 ? '4px' : '0'
                }}
              ></div>
            </div>

            {/* X-axis label - only show every other month for readability */}
            {index % 2 === 0 && (
              <div className="text-xs mt-2 -rotate-45 origin-top-left text-gray-500">
                {formatMonth(item.month)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(ActivityChart);
