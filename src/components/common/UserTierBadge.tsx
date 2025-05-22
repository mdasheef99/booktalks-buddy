import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Star, Crown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type UserTierBadgeProps = {
  tier: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
};

/**
 * Component for displaying a user's account tier as a badge with appropriate styling and icons
 */
const UserTierBadge: React.FC<UserTierBadgeProps> = ({
  tier,
  className = '',
  size = 'md',
  showTooltip = true,
}) => {
  // Default to 'free' if tier is not provided
  const userTier = tier || 'free';

  // Define badge properties based on tier
  let badgeProps: {
    icon: React.ReactNode;
    label: string;
    tooltip: string;
    className: string;
  };

  // Size classes for the badge (icon-only version)
  const sizeClasses = {
    sm: 'p-0.5 h-4 w-4',
    md: 'p-0.5 h-5 w-5',
    lg: 'p-1 h-6 w-6',
  };

  // Icon size classes (without margin since we're not showing text)
  const iconSizeClasses = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  switch (userTier) {
    case 'privileged':
      badgeProps = {
        icon: <Star className={iconSizeClasses[size]} />,
        label: 'Privileged',
        tooltip: 'Privileged member with premium benefits including book club creation',
        className: 'bg-silver-gradient text-gray-700 border border-gray-300 shadow-sm',
      };
      break;
    case 'privileged_plus':
      badgeProps = {
        icon: <Crown className={iconSizeClasses[size]} />,
        label: 'Privileged+',
        tooltip: 'Privileged+ member with exclusive benefits and priority access',
        className: 'bg-gold-gradient text-amber-800 border border-amber-300 shadow-sm',
      };
      break;
    default:
      // Free tier - no badge displayed
      return null;
  }

  const badge = (
    <Badge
      variant="outline"
      className={`${badgeProps.className} ${sizeClasses[size]} flex items-center justify-center rounded-full flex-shrink-0 ${className}`}
    >
      {badgeProps.icon}
    </Badge>
  );

  // Wrap in tooltip if showTooltip is true
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p>{badgeProps.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
};

export default UserTierBadge;
