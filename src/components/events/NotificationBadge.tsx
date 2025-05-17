import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NotificationBadgeProps {
  count: number;
  className?: string;
  showTooltip?: boolean;
  tooltipText?: string;
  maxCount?: number;
}

/**
 * A notification badge component that displays a count
 * Used for showing unread notifications
 */
const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  className = '',
  showTooltip = true,
  tooltipText = 'Unread notifications',
  maxCount = 99
}) => {
  // Don't render if count is 0
  if (count === 0) return null;

  // Format the count (e.g., 99+ if count > maxCount)
  const formattedCount = count > maxCount ? `${maxCount}+` : count.toString();

  const badge = (
    <Badge
      className={`bg-bookconnect-terracotta text-white font-medium px-1.5 py-0.5 min-w-5 text-center ${className}`}
    >
      {formattedCount}
    </Badge>
  );

  // Wrap in tooltip if showTooltip is true
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">{badge}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
};

export default NotificationBadge;
