import React from 'react';
import { cn } from '@/lib/utils';
import { DragHandleProps } from '../types/bannerGridTypes';
import { ACTION_ICONS, STATUS_ICONS, STATUS_COLORS, DRAG_DROP_CONFIG, getPriorityDisplayText, hasExternalLink, calculateBannerStatus } from '../utils';

/**
 * Drag handle component with status indicators
 * Shows priority order and banner status icons
 */
export const DragHandle: React.FC<DragHandleProps> = ({ banner, dragHandleProps }) => {
  const { isActive, isScheduled, isExpired } = calculateBannerStatus(banner);

  return (
    <div
      {...dragHandleProps}
      className={cn("flex items-center justify-between mb-3", DRAG_DROP_CONFIG.GRAB_CURSOR)}
    >
      <div className="flex items-center gap-2">
        <ACTION_ICONS.DRAG className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-600">
          {getPriorityDisplayText(banner.priority_order)}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {isActive ? (
          <STATUS_ICONS.ACTIVE className={cn("h-4 w-4", STATUS_COLORS.ACTIVE)} />
        ) : isScheduled ? (
          <STATUS_ICONS.SCHEDULED className={cn("h-4 w-4", STATUS_COLORS.SCHEDULED)} />
        ) : isExpired ? (
          <STATUS_ICONS.EXPIRED className={cn("h-4 w-4", STATUS_COLORS.EXPIRED)} />
        ) : (
          <STATUS_ICONS.INACTIVE className={cn("h-4 w-4", STATUS_COLORS.INACTIVE)} />
        )}
        {hasExternalLink(banner) && (
          <STATUS_ICONS.EXTERNAL_LINK className={cn("h-4 w-4", STATUS_COLORS.EXTERNAL_LINK)} />
        )}
      </div>
    </div>
  );
};
