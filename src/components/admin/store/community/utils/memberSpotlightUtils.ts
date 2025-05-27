/**
 * Member Spotlight Utility Functions
 * Helper functions for member spotlight management operations
 */

import type { 
  MemberSpotlight, 
  MemberSpotlightFormData, 
  StoreUser,
  SpotlightType 
} from '@/lib/api/store/types/communityShowcaseTypes';
import type { 
  SpotlightStats, 
  MemberDisplayInfo,
  SpotlightFilterType 
} from '../types/memberSpotlightTypes';
import { 
  DEFAULT_FORM_DATA, 
  getSpotlightTypeConfig,
  getSpotlightTypeLabel,
  getSpotlightTypeIcon,
  getSpotlightTypeColor
} from '../constants/memberSpotlightConstants';

// ===== FORM DATA UTILITIES =====

/**
 * Create default form data
 */
export const createDefaultFormData = (): MemberSpotlightFormData => ({
  ...DEFAULT_FORM_DATA,
});

/**
 * Convert spotlight to form data for editing
 */
export const spotlightToFormData = (spotlight: MemberSpotlight): MemberSpotlightFormData => ({
  featured_member_id: spotlight.featured_member_id,
  spotlight_type: spotlight.spotlight_type,
  spotlight_description: spotlight.spotlight_description,
  spotlight_end_date: spotlight.spotlight_end_date ? spotlight.spotlight_end_date.split('T')[0] : '',
});

/**
 * Reset form data to defaults
 */
export const resetFormData = (): MemberSpotlightFormData => createDefaultFormData();

// ===== SPOTLIGHT FILTERING =====

/**
 * Filter spotlights by type
 */
export const filterSpotlightsByType = (
  spotlights: MemberSpotlight[], 
  filterType: SpotlightFilterType
): MemberSpotlight[] => {
  if (filterType === 'all') {
    return spotlights;
  }
  
  if (filterType === 'active') {
    return getActiveSpotlights(spotlights);
  }
  
  if (filterType === 'expired') {
    return getExpiredSpotlights(spotlights);
  }
  
  // Filter by specific spotlight type
  return spotlights.filter(s => s.spotlight_type === filterType);
};

/**
 * Get active spotlights
 */
export const getActiveSpotlights = (spotlights: MemberSpotlight[]): MemberSpotlight[] => {
  const now = new Date();
  return spotlights.filter(spotlight => 
    !spotlight.spotlight_end_date || new Date(spotlight.spotlight_end_date) > now
  );
};

/**
 * Get expired spotlights
 */
export const getExpiredSpotlights = (spotlights: MemberSpotlight[]): MemberSpotlight[] => {
  const now = new Date();
  return spotlights.filter(spotlight => 
    spotlight.spotlight_end_date && new Date(spotlight.spotlight_end_date) <= now
  );
};

/**
 * Filter spotlights by member
 */
export const filterSpotlightsByMember = (
  spotlights: MemberSpotlight[], 
  memberId: string | null
): MemberSpotlight[] => {
  if (!memberId) {
    return spotlights;
  }
  return spotlights.filter(s => s.featured_member_id === memberId);
};

// ===== SPOTLIGHT STATISTICS =====

/**
 * Calculate spotlight statistics
 */
export const calculateSpotlightStats = (spotlights: MemberSpotlight[]): SpotlightStats => {
  const stats: SpotlightStats = {
    total: spotlights.length,
    active: 0,
    expired: 0,
    byType: {
      top_reviewer: 0,
      active_member: 0,
      helpful_contributor: 0,
      new_member: 0,
    },
  };

  const now = new Date();

  spotlights.forEach(spotlight => {
    // Count by status
    if (!spotlight.spotlight_end_date || new Date(spotlight.spotlight_end_date) > now) {
      stats.active++;
    } else {
      stats.expired++;
    }

    // Count by type
    stats.byType[spotlight.spotlight_type]++;
  });

  return stats;
};

// ===== SPOTLIGHT SORTING =====

/**
 * Sort spotlights by creation date (newest first)
 */
export const sortSpotlightsByDate = (spotlights: MemberSpotlight[]): MemberSpotlight[] => {
  return [...spotlights].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

/**
 * Sort spotlights by start date (newest first)
 */
export const sortSpotlightsByStartDate = (spotlights: MemberSpotlight[]): MemberSpotlight[] => {
  return [...spotlights].sort((a, b) => 
    new Date(b.spotlight_start_date).getTime() - new Date(a.spotlight_start_date).getTime()
  );
};

/**
 * Sort spotlights by type
 */
export const sortSpotlightsByType = (spotlights: MemberSpotlight[]): MemberSpotlight[] => {
  return [...spotlights].sort((a, b) => 
    a.spotlight_type.localeCompare(b.spotlight_type)
  );
};

// ===== MEMBER UTILITIES =====

/**
 * Get member display information
 */
export const getMemberDisplayInfo = (user: StoreUser): MemberDisplayInfo => {
  const displayName = user.displayname || user.username;
  const initials = displayName.charAt(0).toUpperCase();
  
  return {
    id: user.id,
    username: user.username,
    displayName,
    accountTier: user.account_tier,
    avatar: '', // Could be extended to support actual avatars
    initials,
  };
};

/**
 * Get member display name
 */
export const getMemberDisplayName = (user: StoreUser): string => {
  return user.displayname || user.username;
};

/**
 * Get member initials for avatar
 */
export const getMemberInitials = (user: StoreUser): string => {
  const displayName = getMemberDisplayName(user);
  return displayName.charAt(0).toUpperCase();
};

// ===== SPOTLIGHT TYPE UTILITIES =====

/**
 * Get spotlight type configuration
 */
export const getSpotlightConfig = (type: SpotlightType) => {
  return getSpotlightTypeConfig(type);
};

/**
 * Get spotlight type display label
 */
export const getSpotlightLabel = (type: SpotlightType): string => {
  return getSpotlightTypeLabel(type);
};

/**
 * Get spotlight type icon component
 */
export const getSpotlightIcon = (type: SpotlightType) => {
  return getSpotlightTypeIcon(type);
};

/**
 * Get spotlight type color class
 */
export const getSpotlightColor = (type: SpotlightType): string => {
  return getSpotlightTypeColor(type);
};

// ===== DATE FORMATTING =====

/**
 * Format spotlight date
 */
export const formatSpotlightDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

/**
 * Format spotlight date with time
 */
export const formatSpotlightDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

/**
 * Get relative time for spotlight
 */
export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    return formatSpotlightDate(dateString);
  }
};

/**
 * Check if spotlight is active
 */
export const isSpotlightActive = (spotlight: MemberSpotlight): boolean => {
  if (!spotlight.spotlight_end_date) {
    return true; // Permanent spotlight
  }
  return new Date(spotlight.spotlight_end_date) > new Date();
};

/**
 * Get days until spotlight expires
 */
export const getDaysUntilExpiry = (spotlight: MemberSpotlight): number | null => {
  if (!spotlight.spotlight_end_date) {
    return null; // Permanent spotlight
  }
  
  const endDate = new Date(spotlight.spotlight_end_date);
  const now = new Date();
  const diffInMs = endDate.getTime() - now.getTime();
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffInDays);
};

// ===== VALIDATION HELPERS =====

/**
 * Check if spotlight can be edited
 */
export const canEditSpotlight = (spotlight: MemberSpotlight): boolean => {
  // Add any business logic for when spotlights can be edited
  return true;
};

/**
 * Check if spotlight can be deleted
 */
export const canDeleteSpotlight = (spotlight: MemberSpotlight): boolean => {
  // Add any business logic for when spotlights can be deleted
  return true;
};

// ===== SEARCH UTILITIES =====

/**
 * Filter members by search term
 */
export const filterMembersBySearch = (members: StoreUser[], searchTerm: string): StoreUser[] => {
  if (!searchTerm.trim()) {
    return members;
  }
  
  const term = searchTerm.toLowerCase();
  return members.filter(member => 
    member.username.toLowerCase().includes(term) ||
    (member.displayname && member.displayname.toLowerCase().includes(term))
  );
};

/**
 * Highlight search term in text
 */
export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm.trim()) {
    return text;
  }
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};
