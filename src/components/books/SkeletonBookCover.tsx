import React, { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonBookCoverProps {
  src?: string | null;
  alt: string;
  width: string;
  height: string;
  className?: string;
  viewType?: 'grid' | 'list';
}

/**
 * SkeletonBookCover Component
 * 
 * This component displays a book cover image with a skeleton loading state.
 * It handles loading states and missing images gracefully.
 */
export const SkeletonBookCover: React.FC<SkeletonBookCoverProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  viewType = 'grid'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Handle image load
  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // Handle image error
  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className={cn('relative overflow-hidden', width, height, className)}>
      {/* Skeleton loader shown while image is loading */}
      {isLoading && (
        <Skeleton className={cn('absolute inset-0', width, height)} />
      )}

      {/* Placeholder for missing images */}
      {hasError && (
        <div 
          className={cn(
            'flex items-center justify-center bg-gray-100 text-gray-400',
            width, 
            height
          )}
        >
          <span className="text-xs text-center p-1">No Cover</span>
        </div>
      )}

      {/* Actual image */}
      {src && (
        <img
          src={src}
          alt={alt}
          className={cn(
            'object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            hasError ? 'hidden' : 'block',
            width,
            height
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}

      {/* Placeholder when no image source is provided */}
      {!src && !isLoading && (
        <div 
          className={cn(
            'flex items-center justify-center bg-gray-100 text-gray-400',
            width, 
            height
          )}
        >
          <span className="text-xs text-center p-1">No Cover</span>
        </div>
      )}
    </div>
  );
};

export default SkeletonBookCover;
