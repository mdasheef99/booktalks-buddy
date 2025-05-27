import { PromotionalBanner, CreateBannerData, UpdateBannerData } from '@/lib/api/store/banners';
import { BannerFormData } from '../types/bannerFormTypes';
import { DEFAULT_FORM_VALUES } from './bannerFormConstants';

/**
 * Helper utilities for banner form operations
 * Extracted from BannerEntryModal.tsx for reusability
 */

export const initializeFormData = (editingBanner?: PromotionalBanner | null): BannerFormData => {
  if (editingBanner) {
    return {
      title: editingBanner.title,
      subtitle: editingBanner.subtitle || '',
      content_type: editingBanner.content_type,
      text_content: editingBanner.text_content || '',
      cta_text: editingBanner.cta_text || '',
      cta_url: editingBanner.cta_url || '',
      banner_image_alt: editingBanner.banner_image_alt || '',
      background_color: editingBanner.background_color || '#ffffff',
      text_color: editingBanner.text_color || '#000000',
      animation_type: editingBanner.animation_type || 'none',
      priority_order: editingBanner.priority_order.toString(),
      start_date: editingBanner.start_date ? editingBanner.start_date.split('T')[0] : '',
      end_date: editingBanner.end_date ? editingBanner.end_date.split('T')[0] : '',
      is_active: editingBanner.is_active
    };
  }

  return { ...DEFAULT_FORM_VALUES };
};

export const prepareCreateData = (
  formData: BannerFormData,
  imageUrl: string | null,
  storeId: string
): CreateBannerData => {
  return {
    store_id: storeId,
    title: formData.title.trim(),
    subtitle: formData.subtitle.trim() || undefined,
    content_type: formData.content_type,
    text_content: formData.text_content.trim() || undefined,
    cta_text: formData.cta_text.trim() || undefined,
    cta_url: formData.cta_url.trim() || undefined,
    banner_image_url: imageUrl || undefined,
    banner_image_alt: formData.banner_image_alt.trim() || undefined,
    background_color: formData.background_color,
    text_color: formData.text_color,
    animation_type: formData.animation_type === 'none' ? undefined : formData.animation_type,
    priority_order: formData.priority_order ? parseInt(formData.priority_order) : undefined,
    start_date: formData.start_date || undefined,
    end_date: formData.end_date || undefined,
    is_active: formData.is_active
  };
};

export const prepareUpdateData = (
  formData: BannerFormData,
  imageUrl: string | null
): UpdateBannerData => {
  return {
    title: formData.title.trim(),
    subtitle: formData.subtitle.trim() || undefined,
    content_type: formData.content_type,
    text_content: formData.text_content.trim() || undefined,
    cta_text: formData.cta_text.trim() || undefined,
    cta_url: formData.cta_url.trim() || undefined,
    banner_image_url: imageUrl || undefined,
    banner_image_alt: formData.banner_image_alt.trim() || undefined,
    background_color: formData.background_color,
    text_color: formData.text_color,
    animation_type: formData.animation_type === 'none' ? undefined : formData.animation_type,
    start_date: formData.start_date || undefined,
    end_date: formData.end_date || undefined,
    is_active: formData.is_active
  };
};

export const getInitialImageUrl = (editingBanner?: PromotionalBanner | null): string | null => {
  return editingBanner?.banner_image_url || null;
};

export const shouldShowImageUpload = (contentType: string): boolean => {
  return contentType === 'image' || contentType === 'mixed';
};

export const shouldShowTextContent = (contentType: string): boolean => {
  return contentType === 'text' || contentType === 'mixed';
};

export const formatDateForInput = (dateString?: string): string => {
  if (!dateString) return '';
  return dateString.split('T')[0];
};

export const isEditMode = (editingBanner?: PromotionalBanner | null): boolean => {
  return !!editingBanner;
};
