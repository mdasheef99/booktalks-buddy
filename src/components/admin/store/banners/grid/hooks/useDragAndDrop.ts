import { useState } from 'react';
import { DropResult } from '@hello-pangea/dnd';
import { PromotionalBanner } from '@/lib/api/store/banners';
import { DragDropHookReturn } from '../types/bannerGridTypes';
import { shouldHandleDrag, reorderBanners } from '../utils';

/**
 * Custom hook for managing drag and drop functionality
 * Extracted from BannerManagementGrid.tsx for reusability
 */
export const useDragAndDrop = (): DragDropHookReturn => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleDragStart = (start: any) => {
    setDraggedItem(start.draggableId);
  };

  const handleDragEnd = (
    result: DropResult,
    banners: PromotionalBanner[],
    onReorder: (banners: { id: string; priority_order: number }[]) => void
  ) => {
    setDraggedItem(null);

    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (!shouldHandleDrag(sourceIndex, destinationIndex)) {
      return;
    }

    const reorderedBanners = reorderBanners(banners, sourceIndex, destinationIndex);
    onReorder(reorderedBanners);
  };

  return {
    draggedItem,
    handleDragStart,
    handleDragEnd
  };
};
