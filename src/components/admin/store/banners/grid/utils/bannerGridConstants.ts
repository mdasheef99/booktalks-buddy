import { 
  Type, 
  Image, 
  Layers,
  Eye,
  EyeOff,
  Calendar,
  ExternalLink,
  Megaphone,
  Plus,
  Edit,
  Trash2,
  GripVertical
} from 'lucide-react';
import { ContentTypeMap } from '../types/bannerGridTypes';

/**
 * Constants for banner management grid
 * Extracted from BannerManagementGrid.tsx for reusability
 */

export const CONTENT_TYPE_CONFIG: ContentTypeMap = {
  text: { 
    label: 'Text', 
    icon: Type, 
    color: 'bg-blue-500' 
  },
  image: { 
    label: 'Image', 
    icon: Image, 
    color: 'bg-green-500' 
  },
  mixed: { 
    label: 'Mixed', 
    icon: Layers, 
    color: 'bg-purple-500' 
  }
};

export const BANNER_GRID_CONFIG = {
  ASPECT_RATIO: 'aspect-[3/1]',
  DEFAULT_BACKGROUND_COLOR: '#f3f4f6',
  DEFAULT_TEXT_COLOR: '#000000',
  GRID_COLUMNS: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  CARD_SPACING: 'gap-4'
} as const;

export const DRAG_DROP_CONFIG = {
  DROPPABLE_ID: 'banner-grid',
  DRAG_ANIMATION_CLASSES: 'shadow-lg rotate-1 scale-105',
  GRAB_CURSOR: 'cursor-grab active:cursor-grabbing'
} as const;

export const STATUS_ICONS = {
  ACTIVE: Eye,
  INACTIVE: EyeOff,
  SCHEDULED: Calendar,
  EXPIRED: Calendar,
  EXTERNAL_LINK: ExternalLink
} as const;

export const ACTION_ICONS = {
  ADD: Plus,
  EDIT: Edit,
  DELETE: Trash2,
  DRAG: GripVertical,
  MEGAPHONE: Megaphone
} as const;

export const STATUS_COLORS = {
  ACTIVE: 'text-green-500',
  INACTIVE: 'text-gray-400',
  SCHEDULED: 'text-blue-500',
  EXPIRED: 'text-red-500',
  EXTERNAL_LINK: 'text-blue-500'
} as const;

export const BADGE_VARIANTS = {
  ACTIVE: 'default',
  SCHEDULED: 'secondary',
  EXPIRED: 'outline',
  INACTIVE: 'outline'
} as const;

export const EMPTY_STATE_CONFIG = {
  ICON_SIZE: 'h-8 w-8',
  CONTAINER_SIZE: 'w-16 h-16',
  TITLE: 'No Banners Created',
  DESCRIPTION: 'Create promotional banners to showcase special offers and announcements',
  BUTTON_TEXT: 'Create Your First Banner'
} as const;

export const BANNER_CARD_CONFIG = {
  TRANSITION_CLASSES: 'transition-all duration-200',
  INACTIVE_OPACITY: 'opacity-60',
  PREVIEW_PADDING: 'p-4',
  CONTENT_PADDING: 'p-4',
  BADGE_POSITION_TOP_LEFT: 'absolute top-2 left-2',
  BADGE_POSITION_TOP_RIGHT: 'absolute top-2 right-2',
  TEXT_TRUNCATE: 'line-clamp-1',
  TEXT_TRUNCATE_2: 'line-clamp-2'
} as const;

export const GRID_MESSAGES = {
  BANNER_COUNT: (count: number) => `${count} banner(s) created`,
  REORDERING: 'Updating order...',
  ADD_NEW_BANNER: 'Add New Banner'
} as const;
