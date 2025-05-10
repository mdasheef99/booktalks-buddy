import React from 'react';
import { Badge } from '@/components/ui/badge';

type UserTierBadgeProps = {
  tier: string;
  className?: string;
};

/**
 * Component for displaying a user's account tier as a badge
 */
export function UserTierBadge({ tier, className = '' }: UserTierBadgeProps) {
  let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  let label = 'Free';
  
  switch (tier) {
    case 'privileged':
      badgeVariant = 'secondary';
      label = 'Privileged';
      break;
    case 'privileged_plus':
      badgeVariant = 'destructive';
      label = 'Privileged Plus';
      break;
    default:
      badgeVariant = 'outline';
      label = 'Free';
  }
  
  return (
    <Badge variant={badgeVariant} className={className}>
      {label}
    </Badge>
  );
}
