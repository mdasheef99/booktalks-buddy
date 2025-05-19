import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
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
}

/**
 * An enhanced skeleton component with shimmer effect and delayed appearance
 */
const EnhancedSkeleton: React.FC<EnhancedSkeletonProps> = ({
  className,
  width,
  height,
  shimmer = true,
  delay = 0,
  rounded = 'md',
  ...props
}) => {
  const [visible, setVisible] = React.useState(delay === 0);

  React.useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  const roundedClasses = {
    'none': 'rounded-none',
    'sm': 'rounded-sm',
    'md': 'rounded-md',
    'lg': 'rounded-lg',
    'full': 'rounded-full',
  };

  return (
    <div 
      className={cn(
        "overflow-hidden",
        roundedClasses[rounded],
        visible ? "opacity-100" : "opacity-0",
        "transition-opacity duration-300",
        width,
        height,
        className
      )}
      {...props}
    >
      <Skeleton 
        className={cn(
          "w-full h-full",
          shimmer && "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent"
        )}
      />
    </div>
  );
};

export default EnhancedSkeleton;

// Add shimmer animation to tailwind.config.js
// @keyframes shimmer {
//   100% {
//     transform: translateX(100%);
//   }
// }
