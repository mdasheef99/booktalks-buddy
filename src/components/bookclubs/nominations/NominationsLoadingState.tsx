import React from 'react';
import { Card } from '@/components/ui/card';
import EnhancedSkeleton from './EnhancedSkeleton';
import { BookOpen } from 'lucide-react';

interface NominationsLoadingStateProps {
  viewMode: 'list' | 'grid';
}

/**
 * Enhanced loading state component for nominations with staggered animations
 */
const NominationsLoadingState: React.FC<NominationsLoadingStateProps> = ({
  viewMode
}) => {
  // Generate random widths for more natural-looking skeletons
  const getRandomWidth = (min: number, max: number) => {
    return `${Math.floor(Math.random() * (max - min + 1)) + min}%`;
  };

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <Card
            key={index}
            className="overflow-hidden animate-fade-in transition-all duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Book Cover */}
            <div className="relative w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100 animate-pulse-subtle" />
              <BookOpen className="h-12 w-12 text-gray-300 relative z-10" />
            </div>

            <div className="p-4 space-y-3">
              {/* Title */}
              <EnhancedSkeleton
                height="h-6"
                width={getRandomWidth(60, 90)}
                delay={100 + index * 50}
                className="mb-1"
              />

              {/* Author */}
              <EnhancedSkeleton
                height="h-4"
                width={getRandomWidth(40, 60)}
                delay={200 + index * 50}
                className="mb-2"
              />

              {/* Description - multiple lines with varying widths */}
              <div className="space-y-2 mb-3">
                <EnhancedSkeleton
                  height="h-4"
                  width="w-full"
                  delay={300 + index * 50}
                />
                <EnhancedSkeleton
                  height="h-4"
                  width={getRandomWidth(80, 95)}
                  delay={350 + index * 50}
                />
                <EnhancedSkeleton
                  height="h-4"
                  width={getRandomWidth(50, 90)}
                  delay={400 + index * 50}
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-between pt-1">
                <EnhancedSkeleton
                  height="h-8"
                  width="w-16"
                  delay={450 + index * 50}
                  rounded="md"
                />
                <EnhancedSkeleton
                  height="h-8"
                  width="w-16"
                  delay={500 + index * 50}
                  rounded="md"
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, index) => (
        <Card
          key={index}
          className="p-4 animate-fade-in"
          style={{ animationDelay: `${index * 150}ms` }}
        >
          <div className="flex">
            {/* Book Cover */}
            <div className="relative w-16 h-24 bg-gray-100 rounded mr-4 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100 animate-pulse-subtle" />
              <BookOpen className="h-8 w-8 text-gray-300 relative z-10" />
            </div>

            <div className="flex-1 space-y-2">
              {/* Title */}
              <EnhancedSkeleton
                height="h-6"
                width={getRandomWidth(60, 80)}
                delay={100 + index * 50}
                className="mb-1"
              />

              {/* Author */}
              <EnhancedSkeleton
                height="h-4"
                width={getRandomWidth(40, 60)}
                delay={200 + index * 50}
                className="mb-2"
              />

              {/* Description */}
              <div className="space-y-2 mb-3">
                <EnhancedSkeleton
                  height="h-4"
                  width="w-full"
                  delay={300 + index * 50}
                />
                <EnhancedSkeleton
                  height="h-4"
                  width={getRandomWidth(80, 95)}
                  delay={350 + index * 50}
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-between pt-1">
                <EnhancedSkeleton
                  height="h-8"
                  width="w-20"
                  delay={400 + index * 50}
                  rounded="md"
                />
                <div className="flex gap-2">
                  <EnhancedSkeleton
                    height="h-8"
                    width="w-24"
                    delay={450 + index * 50}
                    rounded="md"
                  />
                  <EnhancedSkeleton
                    height="h-8"
                    width="w-8"
                    delay={500 + index * 50}
                    rounded="md"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default NominationsLoadingState;
