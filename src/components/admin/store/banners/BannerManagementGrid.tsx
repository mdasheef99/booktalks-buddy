import React from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { BannerManagementGridProps } from './grid/types/bannerGridTypes';
import { BANNER_GRID_CONFIG, DRAG_DROP_CONFIG } from './grid/utils';
import { useDragAndDrop, useBannerActions } from './grid/hooks';
import {
  EmptyState,
  BannerCard,
  GridHeader,
  AddBannerCard
} from './grid/components';

/**
 * Drag-and-drop grid for managing promotional banners
 */
export const BannerManagementGrid: React.FC<BannerManagementGridProps> = ({
  banners,
  onEdit,
  onDelete,
  onReorder,
  onAdd,
  isReordering = false
}) => {
  // Custom hooks for state management
  const { draggedItem, handleDragStart, handleDragEnd } = useDragAndDrop();
  const { handleEdit, handleDelete, handleAdd } = useBannerActions(onEdit, onDelete, onAdd);

  // Wrap handleDragEnd to pass required parameters
  const onDragEnd = (result: any) => {
    handleDragEnd(result, banners, onReorder);
  };

  if (banners.length === 0) {
    return <EmptyState onAdd={handleAdd} />;
  }

  return (
    <div className="space-y-4">
      {/* Status Info */}
      <GridHeader bannerCount={banners.length} isReordering={isReordering} />

      {/* Grid */}
      <DragDropContext onDragStart={handleDragStart} onDragEnd={onDragEnd}>
        <Droppable droppableId={DRAG_DROP_CONFIG.DROPPABLE_ID}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn("grid", BANNER_GRID_CONFIG.GRID_COLUMNS, BANNER_GRID_CONFIG.CARD_SPACING)}
            >
              {banners.map((banner, index) => (
                <BannerCard
                  key={banner.id}
                  banner={banner}
                  index={index}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add Banner Button */}
      <AddBannerCard onAdd={handleAdd} />
    </div>
  );
};
