import { Type, Image, Layers } from 'lucide-react';

/**
 * Constants for banner form configuration
 * Extracted from BannerEntryModal.tsx for reusability
 */

export const CONTENT_TYPE_OPTIONS = [
  { value: 'text', label: 'Text Only', icon: Type },
  { value: 'image', label: 'Image Only', icon: Image },
  { value: 'mixed', label: 'Image + Text', icon: Layers }
] as const;

export const ANIMATION_OPTIONS = [
  { value: 'none', label: 'No Animation' },
  { value: 'fade', label: 'Fade In' },
  { value: 'slide', label: 'Slide In' },
  { value: 'bounce', label: 'Bounce In' },
  { value: 'pulse', label: 'Pulse' }
] as const;

export const FORM_FIELD_LIMITS = {
  TITLE_MAX_LENGTH: 100,
  SUBTITLE_MAX_LENGTH: 150,
  TEXT_CONTENT_MAX_LENGTH: 500,
  CTA_TEXT_MAX_LENGTH: 50,
  IMAGE_ALT_MAX_LENGTH: 200
} as const;

export const IMAGE_UPLOAD_CONFIG = {
  BUCKET: 'store-banner-images',
  MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  RECOMMENDED_DIMENSIONS: '1200x400px'
} as const;

export const DEFAULT_FORM_VALUES = {
  title: '',
  subtitle: '',
  content_type: 'text' as const,
  text_content: '',
  cta_text: '',
  cta_url: '',
  banner_image_alt: '',
  background_color: '#ffffff',
  text_color: '#000000',
  animation_type: 'none' as const,
  priority_order: '',
  start_date: '',
  end_date: '',
  is_active: true
} as const;

export const URL_REGEX = /^https?:\/\/.+/;
