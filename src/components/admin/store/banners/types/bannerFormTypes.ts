import { PromotionalBanner, CreateBannerData, UpdateBannerData } from '@/lib/api/store/banners';

/**
 * Type definitions for banner form components
 * Extracted from BannerEntryModal.tsx for reusability
 */

export type ContentType = 'text' | 'image' | 'mixed';
export type AnimationType = 'none' | 'fade' | 'slide' | 'bounce' | 'pulse';

export interface BannerFormData {
  title: string;
  subtitle: string;
  content_type: ContentType;
  text_content: string;
  cta_text: string;
  cta_url: string;
  banner_image_alt: string;
  background_color: string;
  text_color: string;
  animation_type: AnimationType;
  priority_order: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface BannerFormErrors {
  title?: string;
  subtitle?: string;
  text_content?: string;
  cta_text?: string;
  cta_url?: string;
  banner_image?: string;
  banner_image_alt?: string;
  end_date?: string;
  priority_order?: string;
}

export interface BannerEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storeId: string;
  editingBanner?: PromotionalBanner | null;
}

export interface ContentTypeOption {
  value: ContentType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface AnimationOption {
  value: AnimationType;
  label: string;
}

export interface BannerFormHookReturn {
  formData: BannerFormData;
  errors: BannerFormErrors;
  isLoading: boolean;
  updateFormData: (updates: Partial<BannerFormData>) => void;
  validateForm: () => boolean;
  resetForm: () => void;
  handleSubmit: (e: React.FormEvent, imageUrl: string | null, validateForm: () => boolean) => Promise<void>;
  setErrors: (errors: BannerFormErrors) => void;
}

export interface BannerImageUploadHookReturn {
  imageUrl: string | null;
  handleUploadComplete: (url: string) => void;
  handleUploadError: (error: Error) => void;
  clearImage: () => void;
  setImageUrl: (url: string | null) => void;
}

// Form section props interfaces
export interface BannerBasicInfoFormProps {
  formData: BannerFormData;
  errors: BannerFormErrors;
  onUpdate: (updates: Partial<BannerFormData>) => void;
}

export interface BannerContentFormProps {
  formData: BannerFormData;
  errors: BannerFormErrors;
  imageUrl: string | null;
  storeId: string;
  onUpdate: (updates: Partial<BannerFormData>) => void;
  onImageUploadComplete: (url: string) => void;
  onImageUploadError: (error: Error) => void;
}

export interface BannerStylingFormProps {
  formData: BannerFormData;
  errors: BannerFormErrors;
  onUpdate: (updates: Partial<BannerFormData>) => void;
}

export interface BannerSchedulingFormProps {
  formData: BannerFormData;
  errors: BannerFormErrors;
  editingBanner?: PromotionalBanner | null;
  onUpdate: (updates: Partial<BannerFormData>) => void;
}
