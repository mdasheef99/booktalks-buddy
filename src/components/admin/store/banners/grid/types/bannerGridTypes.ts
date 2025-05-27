import { PromotionalBanner } from '@/lib/api/store/banners';
import { LucideIcon } from 'lucide-react';

/**
 * Type definitions for banner management grid components
 * Extracted from BannerManagementGrid.tsx for reusability
 */

export interface BannerManagementGridProps {
  banners: PromotionalBanner[];
  onEdit: (banner: PromotionalBanner) => void;
  onDelete: (bannerId: string) => void;
  onReorder: (banners: { id: string; priority_order: number }[]) => void;
  onAdd: () => void;
  isReordering?: boolean;
}

export interface BannerCardProps {
  banner: PromotionalBanner;
  index: number;
  onEdit: (banner: PromotionalBanner) => void;
  onDelete: (bannerId: string) => void;
  isDragging?: boolean;
}

export interface EmptyStateProps {
  onAdd: () => void;
}

export interface BannerPreviewProps {
  banner: PromotionalBanner;
  className?: string;
}

export interface BannerStatusBadgeProps {
  banner: PromotionalBanner;
  className?: string;
}

export interface ContentTypeBadgeProps {
  contentType: 'text' | 'image' | 'mixed';
  className?: string;
}

export interface BannerActionsProps {
  banner: PromotionalBanner;
  onEdit: (banner: PromotionalBanner) => void;
  onDelete: (bannerId: string) => void;
}

export interface DragHandleProps {
  banner: PromotionalBanner;
  dragHandleProps: any;
}

export interface BannerInfoProps {
  banner: PromotionalBanner;
}

export interface GridHeaderProps {
  bannerCount: number;
  isReordering: boolean;
}

export interface AddBannerCardProps {
  onAdd: () => void;
}

// Content type configuration
export interface ContentTypeConfig {
  label: string;
  icon: LucideIcon;
  color: string;
}

export type ContentTypeMap = {
  [K in 'text' | 'image' | 'mixed']: ContentTypeConfig;
};

// Banner status types
export type BannerStatus = 'active' | 'scheduled' | 'expired' | 'inactive';

export interface BannerStatusInfo {
  status: BannerStatus;
  isActive: boolean;
  isScheduled: boolean;
  isExpired: boolean;
}

// Drag and drop types
export interface DragDropHookReturn {
  draggedItem: string | null;
  handleDragStart: (start: any) => void;
  handleDragEnd: (result: any, banners: PromotionalBanner[], onReorder: (banners: { id: string; priority_order: number }[]) => void) => void;
}

// Banner actions hook types
export interface BannerActionsHookReturn {
  handleEdit: (banner: PromotionalBanner) => void;
  handleDelete: (bannerId: string) => void;
  handleAdd: () => void;
}
