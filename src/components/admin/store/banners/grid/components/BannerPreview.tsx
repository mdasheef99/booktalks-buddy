import React from 'react';
import { cn } from '@/lib/utils';
import { BannerPreviewProps } from '../types/bannerGridTypes';
import { BANNER_GRID_CONFIG, BANNER_CARD_CONFIG, getBannerPreviewStyle } from '../utils';

/**
 * Banner preview component showing banner content
 * Displays title, subtitle with background styling
 */
export const BannerPreview: React.FC<BannerPreviewProps> = ({ banner, className }) => {
  return (
    <div
      className={cn(BANNER_GRID_CONFIG.ASPECT_RATIO, "bg-gray-100 rounded-lg overflow-hidden", className)}
      style={getBannerPreviewStyle(banner)}
    >
      <div className={cn("w-full h-full flex items-center justify-center", BANNER_CARD_CONFIG.PREVIEW_PADDING)}>
        <div className="text-center">
          <h4 className={cn("font-semibold text-sm mb-1", BANNER_CARD_CONFIG.TEXT_TRUNCATE)}>
            {banner.title}
          </h4>
          {banner.subtitle && (
            <p className={cn("text-xs opacity-80", BANNER_CARD_CONFIG.TEXT_TRUNCATE)}>
              {banner.subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
