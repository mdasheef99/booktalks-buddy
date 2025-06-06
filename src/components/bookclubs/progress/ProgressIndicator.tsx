import React from 'react';
import { CheckCircle, Circle, Lock, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProgressIndicatorProps {
  status: 'not_started' | 'reading' | 'finished';
  progressDisplay: string;
  isPrivate: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  lastUpdated?: string;
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  status,
  progressDisplay,
  isPrivate,
  size = 'md',
  showTooltip = true,
  lastUpdated,
  className,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const containerSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays}d ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      }
    }
  };

  const getProgressIcon = () => {
    if (isPrivate) {
      return (
        <div className={cn(
          'relative flex items-center justify-center rounded-full bg-gray-100 border border-gray-200',
          containerSizeClasses[size]
        )}>
          <Lock className={cn('text-gray-500', sizeClasses[size])} />
        </div>
      );
    }

    switch (status) {
      case 'not_started':
        return (
          <div className={cn(
            'relative flex items-center justify-center rounded-full bg-gray-100 border border-gray-200',
            containerSizeClasses[size]
          )}>
            <Circle className={cn('text-gray-400', sizeClasses[size])} />
          </div>
        );
      
      case 'finished':
        return (
          <div className={cn(
            'relative flex items-center justify-center rounded-full bg-green-100 border border-green-200',
            containerSizeClasses[size]
          )}>
            <CheckCircle className={cn('text-green-600', sizeClasses[size])} />
          </div>
        );
      
      case 'reading':
        // Extract percentage for progress ring
        const percentageMatch = progressDisplay.match(/(\d+)%/);
        const percentage = percentageMatch ? parseInt(percentageMatch[1]) : 0;
        
        if (progressDisplay.includes('%')) {
          // Show progress ring for percentage-based progress
          const circumference = 2 * Math.PI * 8; // radius of 8
          const strokeDasharray = circumference;
          const strokeDashoffset = circumference - (percentage / 100) * circumference;
          
          return (
            <div className={cn('relative', containerSizeClasses[size])}>
              <svg
                className="transform -rotate-90 w-full h-full"
                viewBox="0 0 20 20"
              >
                {/* Background circle */}
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-gray-200"
                />
                {/* Progress circle */}
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="text-bookconnect-terracotta transition-all duration-300"
                  strokeLinecap="round"
                />
              </svg>
              {/* Percentage text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn(
                  'font-medium text-bookconnect-terracotta',
                  size === 'sm' ? 'text-[8px]' : size === 'md' ? 'text-[10px]' : 'text-xs'
                )}>
                  {percentage}%
                </span>
              </div>
            </div>
          );
        } else {
          // Show clock icon for chapter/page progress
          return (
            <div className={cn(
              'relative flex items-center justify-center rounded-full bg-blue-100 border border-blue-200',
              containerSizeClasses[size]
            )}>
              <Clock className={cn('text-blue-600', sizeClasses[size])} />
            </div>
          );
        }
      
      default:
        return (
          <div className={cn(
            'relative flex items-center justify-center rounded-full bg-gray-100 border border-gray-200',
            containerSizeClasses[size]
          )}>
            <Circle className={cn('text-gray-400', sizeClasses[size])} />
          </div>
        );
    }
  };

  const getTooltipContent = () => {
    if (isPrivate) {
      return (
        <div className="text-center">
          <p className="font-medium">Private Progress</p>
          <p className="text-xs text-gray-300">Only visible to the user</p>
        </div>
      );
    }

    return (
      <div className="text-center">
        <p className="font-medium">{progressDisplay}</p>
        {lastUpdated && (
          <p className="text-xs text-gray-300">
            Updated {formatLastUpdated(lastUpdated)}
          </p>
        )}
        {status === 'reading' && !progressDisplay.includes('%') && (
          <p className="text-xs text-gray-300">
            {progressDisplay}
          </p>
        )}
      </div>
    );
  };

  const indicator = (
    <div className={cn('flex items-center justify-center', className)}>
      {getProgressIcon()}
    </div>
  );

  if (!showTooltip) {
    return indicator;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ProgressIndicator;
