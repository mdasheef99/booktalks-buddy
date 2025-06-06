import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ContentTypeBadgeProps } from '../types/bannerGridTypes';
import { BANNER_CARD_CONFIG, getContentTypeConfig } from '../utils';

/**
 * Content type badge component
 * Shows text, image, or mixed content type with appropriate icon
 */
export const ContentTypeBadge: React.FC<ContentTypeBadgeProps> = ({ contentType, className }) => {
  const contentTypeInfo = getContentTypeConfig(contentType);
  const ContentTypeIcon = contentTypeInfo.icon;

  return (
    <Badge
      className={cn(
        BANNER_CARD_CONFIG.BADGE_POSITION_TOP_LEFT,
        "text-xs",
        contentTypeInfo.color,
        "text-white border-0",
        className
      )}
    >
      <ContentTypeIcon className="h-3 w-3 mr-1" />
      {contentTypeInfo.label}
    </Badge>
  );
};
