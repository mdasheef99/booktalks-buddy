import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { BannerCardProps } from '../types/bannerGridTypes';
import { calculateBannerStatus, getBannerCardClasses } from '../utils';
import { DragHandle } from './DragHandle';
import { BannerPreview } from './BannerPreview';
import { ContentTypeBadge } from './ContentTypeBadge';
import { BannerStatusBadge } from './BannerStatusBadge';
import { BannerInfo } from './BannerInfo';
import { BannerActions } from './BannerActions';

/**
 * Individual banner card component
 * Displays banner information with drag and drop functionality
 */
export const BannerCard: React.FC<BannerCardProps> = ({ banner, index, onEdit, onDelete }) => {
  const { isActive } = calculateBannerStatus(banner);

  return (
    <Draggable draggableId={banner.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={getBannerCardClasses(snapshot.isDragging, isActive)}
        >
          <CardContent className="p-4">
            {/* Drag Handle & Status */}
            <DragHandle banner={banner} dragHandleProps={provided.dragHandleProps} />

            {/* Banner Preview */}
            <div className="relative mb-3">
              <BannerPreview banner={banner} />
              
              {/* Content Type Badge */}
              <ContentTypeBadge contentType={banner.content_type} />

              {/* Status Badge */}
              <BannerStatusBadge banner={banner} />
            </div>

            {/* Banner Info */}
            <BannerInfo banner={banner} />

            {/* Action Buttons */}
            <BannerActions banner={banner} onEdit={onEdit} onDelete={onDelete} />
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};
