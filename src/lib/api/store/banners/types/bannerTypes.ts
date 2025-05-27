/**
 * Type definitions for banner API services
 * Extracted from banners.ts for better organization
 */

export interface PromotionalBanner {
  id: string;
  store_id: string;
  title: string;
  subtitle?: string;
  content_type: 'text' | 'image' | 'mixed';
  text_content?: string;
  cta_text?: string;
  cta_url?: string;
  banner_image_url?: string;
  banner_image_alt?: string;
  background_color?: string;
  text_color?: string;
  animation_type?: 'none' | 'fade' | 'slide' | 'bounce' | 'pulse';
  priority_order: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBannerData {
  store_id: string;
  title: string;
  subtitle?: string;
  content_type: 'text' | 'image' | 'mixed';
  text_content?: string;
  cta_text?: string;
  cta_url?: string;
  banner_image_url?: string;
  banner_image_alt?: string;
  background_color?: string;
  text_color?: string;
  animation_type?: 'none' | 'fade' | 'slide' | 'bounce' | 'pulse';
  priority_order?: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export interface UpdateBannerData {
  title?: string;
  subtitle?: string;
  content_type?: 'text' | 'image' | 'mixed';
  text_content?: string;
  cta_text?: string;
  cta_url?: string;
  banner_image_url?: string;
  banner_image_alt?: string;
  background_color?: string;
  text_color?: string;
  animation_type?: 'none' | 'fade' | 'slide' | 'bounce' | 'pulse';
  priority_order?: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export interface BannerPosition {
  id: string;
  priority_order: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface BannerQueryOptions {
  storeId: string;
  includeInactive?: boolean;
  limit?: number;
  orderBy?: 'priority_order' | 'created_at' | 'updated_at';
  orderDirection?: 'asc' | 'desc';
}

export interface ActiveBannerOptions {
  storeId: string;
  limit?: number;
  currentTime?: string;
}

export interface ScheduledBannerOptions {
  storeId: string;
  dateRange: DateRange;
  includeInactive?: boolean;
}

// Content type enumeration
export type BannerContentType = 'text' | 'image' | 'mixed';

// Animation type enumeration  
export type BannerAnimationType = 'none' | 'fade' | 'slide' | 'bounce' | 'pulse';

// Service response types
export interface BannerServiceResponse<T> {
  data: T;
  error?: string;
}

export interface BannerValidationResult {
  isValid: boolean;
  errors: string[];
}

// Priority management types
export interface PriorityOrderResult {
  nextOrder: number;
  isAvailable: boolean;
}

export interface BulkUpdateResult {
  successful: string[];
  failed: { id: string; error: string }[];
}
