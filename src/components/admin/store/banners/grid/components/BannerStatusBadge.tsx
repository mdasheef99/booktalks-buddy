import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BannerStatusBadgeProps } from '../types/bannerGridTypes';
import { BADGE_VARIANTS, BANNER_CARD_CONFIG, calculateBannerStatus, getStatusDisplayText } from '../utils';

/**
 * Status badge component for banners
 * Shows active, scheduled, expired, or inactive status
 */
export const BannerStatusBadge: React.FC<BannerStatusBadgeProps> = ({ banner, className }) => {
  const { status } = calculateBannerStatus(banner);

  return (
    <Badge
      variant={BADGE_VARIANTS[status.toUpperCase() as keyof typeof BADGE_VARIANTS] as any}
      className={cn(BANNER_CARD_CONFIG.BADGE_POSITION_TOP_RIGHT, "text-xs", className)}
    >
      {getStatusDisplayText(status)}
    </Badge>
  );
};
