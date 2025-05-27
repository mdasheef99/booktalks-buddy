import { CarouselItem, CreateCarouselItemData, UpdateCarouselItemData } from '@/lib/api/store/carousel';

/**
 * Type definitions for book form components
 * Extracted from BookEntryModal.tsx for reusability
 */

export type FeaturedBadgeType = 'none' | 'new_arrival' | 'staff_pick' | 'bestseller' | 'on_sale' | 'featured';

export interface BookFormData {
  position: string;
  book_title: string;
  book_author: string;
  book_isbn: string;
  custom_description: string;
  featured_badge: FeaturedBadgeType;
  overlay_text: string;
  book_image_alt: string;
  click_destination_url: string;
  is_active: boolean;
}

export interface BookFormErrors {
  position?: string;
  book_title?: string;
  book_author?: string;
  book_isbn?: string;
  custom_description?: string;
  featured_badge?: string;
  overlay_text?: string;
  book_image_alt?: string;
  click_destination_url?: string;
  book_image?: string;
}

export interface BookEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storeId: string;
  editingItem?: CarouselItem | null;
}

export interface FeaturedBadgeOption {
  value: FeaturedBadgeType;
  label: string;
}

export interface BookFormHookReturn {
  formData: BookFormData;
  errors: BookFormErrors;
  isLoading: boolean;
  updateFormData: (updates: Partial<BookFormData>) => void;
  validateForm: () => boolean;
  resetForm: () => void;
  handleSubmit: (e: React.FormEvent, imageUrl: string | null, validateForm: () => boolean) => Promise<void>;
  setErrors: (errors: BookFormErrors) => void;
}

export interface BookImageUploadHookReturn {
  imageUrl: string | null;
  handleUploadComplete: (url: string) => void;
  handleUploadError: (error: Error) => void;
  clearImage: () => void;
  setImageUrl: (url: string | null) => void;
}

export interface BookValidationHookReturn {
  errors: BookFormErrors;
  validateForm: (formData: BookFormData, imageUrl: string | null, editingItem?: CarouselItem | null) => boolean;
  setErrors: (errors: BookFormErrors) => void;
  clearErrors: () => void;
}

// Form section props interfaces
export interface BookBasicInfoFormProps {
  formData: BookFormData;
  errors: BookFormErrors;
  editingItem?: CarouselItem | null;
  onUpdate: (updates: Partial<BookFormData>) => void;
}

export interface BookContentFormProps {
  formData: BookFormData;
  errors: BookFormErrors;
  imageUrl: string | null;
  storeId: string;
  onUpdate: (updates: Partial<BookFormData>) => void;
  onImageUploadComplete: (url: string) => void;
  onImageUploadError: (error: Error) => void;
}

export interface BookSettingsFormProps {
  formData: BookFormData;
  errors: BookFormErrors;
  imageUrl: string | null;
  onUpdate: (updates: Partial<BookFormData>) => void;
}
