import React from 'react';
import { cn } from '@/lib/utils';

interface EnhancedSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Width of the skeleton
   */
  width?: string;
  /**
   * Height of the skeleton
   */
  height?: string;
  /**
   * Whether to show a shimmer effect
   */
  shimmer?: boolean;
  /**
   * Delay before showing the skeleton (ms)
   */
  delay?: number;
  /**
   * Whether to round the skeleton
   */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  /**
   * Animation type
   */
  animation?: 'pulse' | 'shimmer' | 'wave';
}

/**
 * Enhanced skeleton component with shimmer effects and book-themed styling
 */
export const EnhancedSkeleton: React.FC<EnhancedSkeletonProps> = ({
  width = 'w-full',
  height = 'h-4',
  shimmer = true,
  delay = 0,
  rounded = 'md',
  animation = 'shimmer',
  className,
  ...props
}) => {
  const [isVisible, setIsVisible] = React.useState(delay === 0);

  React.useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setIsVisible(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  if (!isVisible) return null;

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer',
    wave: 'animate-wave'
  };

  return (
    <div
      className={cn(
        'bg-gradient-to-r from-bookconnect-brown/10 via-bookconnect-sage/10 to-bookconnect-brown/10',
        'relative overflow-hidden',
        width,
        height,
        roundedClasses[rounded],
        shimmer && animationClasses[animation],
        className
      )}
      {...props}
    >
      {shimmer && animation === 'shimmer' && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}
    </div>
  );
};

/**
 * Book-themed skeleton for book cards
 */
export const BookCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('bg-white/90 rounded-xl p-4 shadow-lg', className)}>
    <EnhancedSkeleton 
      height="h-48" 
      rounded="lg" 
      className="mb-4 bg-gradient-to-br from-bookconnect-brown/10 to-bookconnect-sage/10" 
    />
    <div className="space-y-2">
      <EnhancedSkeleton height="h-4" width="w-3/4" />
      <EnhancedSkeleton height="h-3" width="w-1/2" />
      <EnhancedSkeleton height="h-8" width="w-full" className="mt-4 bg-bookconnect-terracotta/20" />
    </div>
  </div>
);

/**
 * Chat message skeleton for loading states
 */
export const ChatMessageSkeleton: React.FC<{ isCurrentUser?: boolean; className?: string }> = ({ 
  isCurrentUser = false, 
  className 
}) => (
  <div className={cn('flex', isCurrentUser ? 'justify-end' : 'justify-start', className)}>
    <div className={cn(
      'max-w-md p-4 rounded-2xl space-y-2',
      isCurrentUser 
        ? 'bg-bookconnect-sage/10 rounded-br-md' 
        : 'bg-white/90 border border-bookconnect-brown/10 rounded-bl-md'
    )}>
      {!isCurrentUser && (
        <EnhancedSkeleton height="h-3" width="w-16" className="mb-2" />
      )}
      <EnhancedSkeleton height="h-4" width="w-24" />
      <EnhancedSkeleton height="h-4" width="w-32" />
      <EnhancedSkeleton height="h-3" width="w-12" className="mt-2 ml-auto" />
    </div>
  </div>
);

/**
 * Search result skeleton for explore page
 */
export const SearchResultSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6', className)}>
    {Array.from({ length: 8 }).map((_, idx) => (
      <BookCardSkeleton key={idx} />
    ))}
  </div>
);

/**
 * Hero section skeleton for landing page
 */
export const HeroSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('min-h-[65vh] flex items-center justify-center text-center px-4 py-24', className)}>
    <div className="z-10 max-w-4xl space-y-6">
      <EnhancedSkeleton height="h-6" width="w-48" className="mx-auto" rounded="full" />
      <EnhancedSkeleton height="h-16" width="w-full" className="mx-auto" />
      <EnhancedSkeleton height="h-6" width="w-3/4" className="mx-auto" />
      <EnhancedSkeleton height="h-12" width="w-64" className="mx-auto mt-10" rounded="lg" />
    </div>
  </div>
);

export default EnhancedSkeleton;
