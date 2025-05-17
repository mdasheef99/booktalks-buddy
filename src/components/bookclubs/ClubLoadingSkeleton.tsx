import React, { memo } from 'react';
import { Card } from '@/components/ui/card';

interface ClubLoadingSkeletonProps {
  count?: number;
}

const ClubLoadingSkeleton: React.FC<ClubLoadingSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="space-y-4" aria-label="Loading book clubs">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="flex justify-between items-center mt-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(ClubLoadingSkeleton);
