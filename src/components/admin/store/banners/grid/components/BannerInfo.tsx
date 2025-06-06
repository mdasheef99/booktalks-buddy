import React from 'react';
import { cn } from '@/lib/utils';
import { BannerInfoProps } from '../types/bannerGridTypes';
import { BANNER_CARD_CONFIG, hasScheduleInfo, formatDisplayDate } from '../utils';

/**
 * Banner information component
 * Shows title, content, and schedule information
 */
export const BannerInfo: React.FC<BannerInfoProps> = ({ banner }) => {
  return (
    <div className="space-y-2 mb-4">
      <h4 className={cn("font-semibold text-sm", BANNER_CARD_CONFIG.TEXT_TRUNCATE)}>
        {banner.title}
      </h4>
      
      {banner.text_content && (
        <p className={cn("text-xs text-gray-600", BANNER_CARD_CONFIG.TEXT_TRUNCATE_2)}>
          {banner.text_content}
        </p>
      )}

      {/* Schedule Info */}
      {hasScheduleInfo(banner) && (
        <div className="text-xs text-gray-500">
          {banner.start_date && (
            <div>Starts: {formatDisplayDate(banner.start_date)}</div>
          )}
          {banner.end_date && (
            <div>Ends: {formatDisplayDate(banner.end_date)}</div>
          )}
        </div>
      )}
    </div>
  );
};
