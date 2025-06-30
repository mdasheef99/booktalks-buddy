/**
 * Reading Status Badge Component
 * 
 * Displays reading status with appropriate colors and icons
 * Follows BookConnect design system patterns
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { BookOpen, BookMarked, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReadingStatus } from '@/services/books';

interface ReadingStatusBadgeProps {
  status: ReadingStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const ReadingStatusBadge: React.FC<ReadingStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className
}) => {
  const getStatusConfig = (status: ReadingStatus) => {
    switch (status) {
      case 'want_to_read':
        return {
          label: 'Want to Read',
          icon: BookMarked,
          className: 'bg-bookconnect-sage text-white border-bookconnect-sage'
        };
      case 'currently_reading':
        return {
          label: 'Currently Reading',
          icon: BookOpen,
          className: 'bg-bookconnect-terracotta text-white border-bookconnect-terracotta'
        };
      case 'completed':
        return {
          label: 'Completed',
          icon: CheckCircle,
          className: 'bg-bookconnect-olive text-white border-bookconnect-olive'
        };
      default:
        return {
          label: 'Unknown',
          icon: BookOpen,
          className: 'bg-gray-500 text-white border-gray-500'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <Badge
      className={cn(
        'flex items-center gap-1.5 font-medium shadow-sm',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <Icon className={iconSizes[size]} />
      )}
      <span>{config.label}</span>
    </Badge>
  );
};

export default ReadingStatusBadge;
