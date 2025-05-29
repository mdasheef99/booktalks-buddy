import { CarouselItem, CreateCarouselItemData, UpdateCarouselItemData } from '@/lib/api/store/carousel';
import { BookFormData } from '../types/bookFormTypes';
import { DEFAULT_FORM_VALUES } from './bookFormConstants';

/**
 * Helper functions for book form operations
 * Extracted from BookEntryModal.tsx for reusability
 */

/**
 * Initialize form data based on editing item or default values
 */
export const initializeFormData = (editingItem?: CarouselItem | null): BookFormData => {
  if (editingItem) {
    return {
      position: editingItem.position.toString(),
      book_title: editingItem.book_title,
      book_author: editingItem.book_author,
      book_isbn: editingItem.book_isbn || '',
      custom_description: editingItem.custom_description || '',
      featured_badge: editingItem.featured_badge || 'none',
      overlay_text: editingItem.overlay_text || '',
      book_image_alt: editingItem.book_image_alt || '',
      click_destination_url: editingItem.click_destination_url || '',
      is_active: editingItem.is_active
    };
  }

  return { ...DEFAULT_FORM_VALUES };
};

/**
 * Prepare data for creating a new carousel item
 */
export const prepareCreateData = (
  formData: BookFormData,
  imageUrl: string | null,
  storeId: string
): CreateCarouselItemData => {
  console.log('🔍 prepareCreateData - Input imageUrl:', imageUrl);
  console.log('🔍 prepareCreateData - Input formData:', formData);

  const baseData = prepareBaseData(formData, imageUrl);
  console.log('🔍 prepareCreateData - Prepared baseData:', baseData);

  const result = {
    ...baseData,
    store_id: storeId,
    position: formData.position ? parseInt(formData.position) : undefined as any
  };

  console.log('🔍 prepareCreateData - Final result:', result);
  return result;
};

/**
 * Prepare data for updating an existing carousel item
 */
export const prepareUpdateData = (
  formData: BookFormData,
  imageUrl: string | null
): UpdateCarouselItemData => {
  return prepareBaseData(formData, imageUrl);
};

/**
 * Prepare base data common to both create and update operations
 */
const prepareBaseData = (formData: BookFormData, imageUrl: string | null) => {
  console.log('🔍 prepareBaseData - Input imageUrl:', imageUrl);
  console.log('🔍 prepareBaseData - Processing image URL...');

  const result = {
    book_title: formData.book_title.trim(),
    book_author: formData.book_author.trim(),
    book_isbn: formData.book_isbn.trim() || undefined,
    custom_description: formData.custom_description.trim() || undefined,
    featured_badge: formData.featured_badge === 'none' ? undefined : formData.featured_badge,
    overlay_text: formData.overlay_text.trim() || undefined,
    book_image_url: imageUrl || undefined,
    book_image_alt: formData.book_image_alt.trim() || undefined,
    click_destination_url: formData.click_destination_url.trim() || undefined,
    is_active: formData.is_active
  };

  console.log('🔍 prepareBaseData - Final book_image_url:', result.book_image_url);
  return result;
};

/**
 * Check if we're in edit mode
 */
export const isEditMode = (editingItem?: CarouselItem | null): editingItem is CarouselItem => {
  return editingItem != null;
};

/**
 * Trim all string fields in form data
 */
export const trimFormData = (formData: BookFormData): BookFormData => {
  return {
    ...formData,
    book_title: formData.book_title.trim(),
    book_author: formData.book_author.trim(),
    book_isbn: formData.book_isbn.trim(),
    custom_description: formData.custom_description.trim(),
    overlay_text: formData.overlay_text.trim(),
    book_image_alt: formData.book_image_alt.trim(),
    click_destination_url: formData.click_destination_url.trim()
  };
};

/**
 * Get character count for description field
 */
export const getDescriptionCharacterCount = (description: string): string => {
  return `${description.length}/300 characters`;
};
