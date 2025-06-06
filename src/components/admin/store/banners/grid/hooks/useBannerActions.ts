import { useCallback } from 'react';
import { PromotionalBanner } from '@/lib/api/store/banners';
import { BannerActionsHookReturn } from '../types/bannerGridTypes';

/**
 * Custom hook for managing banner actions
 * Extracted from BannerManagementGrid.tsx for reusability
 */
export const useBannerActions = (
  onEdit: (banner: PromotionalBanner) => void,
  onDelete: (bannerId: string) => void,
  onAdd: () => void
): BannerActionsHookReturn => {
  const handleEdit = useCallback((banner: PromotionalBanner) => {
    onEdit(banner);
  }, [onEdit]);

  const handleDelete = useCallback((bannerId: string) => {
    onDelete(bannerId);
  }, [onDelete]);

  const handleAdd = useCallback(() => {
    onAdd();
  }, [onAdd]);

  return {
    handleEdit,
    handleDelete,
    handleAdd
  };
};
