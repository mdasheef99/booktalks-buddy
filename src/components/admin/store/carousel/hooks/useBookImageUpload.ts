import { useImageUpload } from '@/components/ui/ImageUpload';
import { CarouselItem } from '@/lib/api/store/carousel';
import { BookImageUploadHookReturn } from '../types/bookFormTypes';
import { IMAGE_UPLOAD_CONFIG } from '../utils';

/**
 * Custom hook for managing book image upload
 * Extracted from BookEntryModal.tsx for reusability
 */
export const useBookImageUpload = (
  storeId: string,
  editingItem?: CarouselItem | null
): BookImageUploadHookReturn => {
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

  return {
    imageUrl,
    handleUploadComplete,
    handleUploadError,
    clearImage,
    setImageUrl
  };
};
