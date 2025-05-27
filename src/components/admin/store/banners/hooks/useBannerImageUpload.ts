import { useEffect } from 'react';
import { useImageUpload } from '@/components/ui/ImageUpload';
import { PromotionalBanner } from '@/lib/api/store/banners';
import {
  BannerImageUploadHookReturn,
  IMAGE_UPLOAD_CONFIG,
  getInitialImageUrl
} from '../utils';

/**
 * Custom hook for managing banner image upload
 * Extracted from BannerEntryModal.tsx for reusability
 */
export const useBannerImageUpload = (
  storeId: string,
  editingBanner?: PromotionalBanner | null
): BannerImageUploadHookReturn => {
  const {
    imageUrl,
    handleUploadComplete,
    handleUploadError,
    clearImage,
    setImageUrl
  } = useImageUpload({
    bucket: IMAGE_UPLOAD_CONFIG.BUCKET,
    folder: storeId,
    maxSizeBytes: IMAGE_UPLOAD_CONFIG.MAX_SIZE_BYTES,
    allowedTypes: IMAGE_UPLOAD_CONFIG.ALLOWED_TYPES
  });

  // Initialize image URL when editing banner changes
  useEffect(() => {
    const initialImageUrl = getInitialImageUrl(editingBanner);
    setImageUrl(initialImageUrl);
    
    if (!editingBanner) {
      clearImage();
    }
  }, [editingBanner, setImageUrl, clearImage]);

  return {
    imageUrl,
    handleUploadComplete,
    handleUploadError,
    clearImage,
    setImageUrl
  };
};
