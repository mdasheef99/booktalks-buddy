import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Star, Crown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type UserTierBadgeProps = {
  tier: string;
  className?: string;
  showTooltip?: boolean;
};

/**
 * Component for displaying a user's account tier as a badge
 */
export function UserTierBadge({ tier, className = '', showTooltip = true }: UserTierBadgeProps) {
  // Define badge properties based on tier
  let badgeProps: {
    icon: React.ReactNode;
    tooltip: string;
    className: string;
  } | null = null;

  switch (tier) {
    case 'privileged':
      badgeProps = {
        icon: <Star className="h-3.5 w-3.5" />,
        tooltip: 'Privileged member with premium benefits including book club creation',
        className: 'bg-silver-gradient text-gray-700 border border-gray-300 shadow-sm',
      };
      break;
    case 'privileged_plus':
      badgeProps = {
        icon: <Crown className="h-3.5 w-3.5" />,
        tooltip: 'Privileged+ member with exclusive benefits and priority access',
        className: 'bg-gold-gradient text-amber-800 border border-amber-300 shadow-sm',
      };
      break;
    default:
      // Free tier - show a simple text badge
      return (
        <Badge variant="outline" className={`text-xs py-0.5 px-2 ${className}`}>
          Free
        </Badge>
      );
  }

  const badge = (
    <Badge
      variant="outline"
      className={`p-0.5 h-5 w-5 flex items-center justify-center rounded-full flex-shrink-0 ${badgeProps.className} ${className}`}
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
}
