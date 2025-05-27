import { PromotionalBanner } from '@/lib/api/store/banners';
import { BannerStatus, BannerStatusInfo } from '../types/bannerGridTypes';
import { CONTENT_TYPE_CONFIG } from './bannerGridConstants';

/**
 * Helper functions for banner management grid
 * Extracted from BannerManagementGrid.tsx for reusability
 */

/**
 * Calculate banner status based on dates and active flag
 */
export const calculateBannerStatus = (banner: PromotionalBanner): BannerStatusInfo => {
  const now = new Date();
  const startDate = banner.start_date ? new Date(banner.start_date) : null;
  const endDate = banner.end_date ? new Date(banner.end_date) : null;
  
  const isScheduled = startDate && startDate > now;
  const isExpired = endDate && endDate <= now;
  const isActive = banner.is_active && !isExpired && (!startDate || startDate <= now);

  let status: BannerStatus;
  if (isActive) {
    status = 'active';
  } else if (isScheduled) {
    status = 'scheduled';
  } else if (isExpired) {
    status = 'expired';
  } else {
    status = 'inactive';
  }

  return {
    status,
    isActive,
    isScheduled,
    isExpired
  };
};

/**
 * Get content type configuration
 */
export const getContentTypeConfig = (contentType: 'text' | 'image' | 'mixed') => {
  return CONTENT_TYPE_CONFIG[contentType];
};

/**
 * Format date for display
 */
export const formatDisplayDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

/**
 * Get banner preview style
 */
export const getBannerPreviewStyle = (banner: PromotionalBanner) => {
  return {
    backgroundColor: banner.background_color || '#f3f4f6',
    backgroundImage: banner.banner_image_url ? `url(${banner.banner_image_url})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: banner.text_color || '#000000'
  };
};

/**
 * Reorder banners based on drag and drop result
 */
export const reorderBanners = (
  banners: PromotionalBanner[],
  sourceIndex: number,
  destinationIndex: number
): { id: string; priority_order: number }[] => {
  const newBanners = [...banners];
  const [movedBanner] = newBanners.splice(sourceIndex, 1);
  newBanners.splice(destinationIndex, 0, movedBanner);

  return newBanners.map((banner, index) => ({
    id: banner.id,
    priority_order: index + 1
  }));
};

/**
 * Check if banner has external link
 */
export const hasExternalLink = (banner: PromotionalBanner): boolean => {
  return Boolean(banner.cta_url);
};

/**
 * Get status display text
 */
export const getStatusDisplayText = (status: BannerStatus): string => {
  const statusMap = {
    active: 'Active',
    scheduled: 'Scheduled',
    expired: 'Expired',
    inactive: 'Inactive'
  };
  return statusMap[status];
};

/**
 * Check if drag operation should be handled
 */
export const shouldHandleDrag = (
  sourceIndex: number,
  destinationIndex: number | undefined
): boolean => {
  return destinationIndex !== undefined && sourceIndex !== destinationIndex;
};

/**
 * Get banner card CSS classes
 */
export const getBannerCardClasses = (isDragging: boolean, isActive: boolean): string => {
  const baseClasses = 'transition-all duration-200';
  const dragClasses = isDragging ? 'shadow-lg rotate-1 scale-105' : '';
  const activeClasses = isActive ? '' : 'opacity-60';
  
  return [baseClasses, dragClasses, activeClasses].filter(Boolean).join(' ');
};

/**
 * Get priority display text
 */
export const getPriorityDisplayText = (priorityOrder: number): string => {
  return `Priority ${priorityOrder}`;
};

/**
 * Check if banner has schedule information
 */
export const hasScheduleInfo = (banner: PromotionalBanner): boolean => {
  return Boolean(banner.start_date || banner.end_date);
};
