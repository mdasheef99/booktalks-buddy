import type { UserProfile } from '@/services/profileService';

/**
 * Avatar utility functions for smart loading and display context optimization
 */

export type AvatarSize = 'thumbnail' | 'medium' | 'full';

export interface AvatarConfig {
  size: AvatarSize;
  width: number;
  height: number;
  className?: string;
}

/**
 * Predefined avatar configurations for different UI contexts
 */
export const AVATAR_CONFIGS: Record<string, AvatarConfig> = {
  // Navigation and small UI elements
  nav: { size: 'thumbnail', width: 32, height: 32, className: 'h-8 w-8' },
  navLarge: { size: 'thumbnail', width: 40, height: 40, className: 'h-10 w-10' },
  
  // Lists and cards
  listItem: { size: 'medium', width: 48, height: 48, className: 'h-12 w-12' },
  card: { size: 'medium', width: 64, height: 64, className: 'h-16 w-16' },
  cardLarge: { size: 'medium', width: 80, height: 80, className: 'h-20 w-20' },
  
  // Profile contexts
  profileHeader: { size: 'full', width: 96, height: 96, className: 'h-24 w-24' },
  profileLarge: { size: 'full', width: 128, height: 128, className: 'h-32 w-32' },
  profileXL: { size: 'full', width: 160, height: 160, className: 'h-40 w-40' },

  // Mobile-optimized profile contexts
  profileMobile: { size: 'medium', width: 80, height: 80, className: 'h-20 w-20' },
  profileMobileLarge: { size: 'full', width: 96, height: 96, className: 'h-24 w-24' },
  
  // Special contexts
  message: { size: 'thumbnail', width: 36, height: 36, className: 'h-9 w-9' },
  comment: { size: 'thumbnail', width: 32, height: 32, className: 'h-8 w-8' },
  mention: { size: 'thumbnail', width: 24, height: 24, className: 'h-6 w-6' }
};

/**
 * Gets the optimal avatar URL based on display context
 */
export function getAvatarUrl(profile: UserProfile | null, context: string): string | null {
  if (!profile) return null;

  const config = AVATAR_CONFIGS[context];
  if (!config) {
    console.warn(`Unknown avatar context: ${context}. Using medium size as fallback.`);
    return profile.avatar_medium_url || profile.avatar_url;
  }

  // Return the appropriate size with fallbacks
  switch (config.size) {
    case 'thumbnail':
      return profile.avatar_thumbnail_url || profile.avatar_medium_url || profile.avatar_full_url || profile.avatar_url;
    
    case 'medium':
      return profile.avatar_medium_url || profile.avatar_full_url || profile.avatar_thumbnail_url || profile.avatar_url;
    
    case 'full':
      return profile.avatar_full_url || profile.avatar_medium_url || profile.avatar_thumbnail_url || profile.avatar_url;
    
    default:
      return profile.avatar_medium_url || profile.avatar_url;
  }
}

/**
 * Gets avatar configuration for a specific context
 */
export function getAvatarConfig(context: string): AvatarConfig {
  const config = AVATAR_CONFIGS[context];
  if (!config) {
    console.warn(`Unknown avatar context: ${context}. Using card configuration as fallback.`);
    return AVATAR_CONFIGS.card;
  }
  return config;
}

/**
 * Generates user initials for avatar fallback
 */
export function getUserInitials(profile: UserProfile | null): string {
  if (!profile) return '?';

  // Try displayname first, then username, then email
  const name = profile.displayname || profile.username || profile.email;
  if (!name) return '?';

  // For email addresses, use the part before @
  const displayName = name.includes('@') ? name.split('@')[0] : name;
  
  // Split by spaces, hyphens, underscores, or dots
  const parts = displayName.split(/[\s\-_.]+/).filter(part => part.length > 0);
  
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    // Single word - take first 2 characters
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  // Multiple words - take first character of first two words
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Checks if a user has any avatar set
 */
export function hasAvatar(profile: UserProfile | null): boolean {
  if (!profile) return false;
  
  return !!(
    profile.avatar_thumbnail_url ||
    profile.avatar_medium_url ||
    profile.avatar_full_url ||
    profile.avatar_url
  );
}

/**
 * Gets the best available avatar URL (highest quality available)
 */
export function getBestAvatarUrl(profile: UserProfile | null): string | null {
  if (!profile) return null;
  
  return (
    profile.avatar_full_url ||
    profile.avatar_medium_url ||
    profile.avatar_thumbnail_url ||
    profile.avatar_url
  );
}

/**
 * Preloads avatar images for better performance
 */
export function preloadAvatarImages(profiles: UserProfile[]): void {
  profiles.forEach(profile => {
    if (!hasAvatar(profile)) return;

    // Preload all available sizes
    [
      profile.avatar_thumbnail_url,
      profile.avatar_medium_url,
      profile.avatar_full_url
    ].forEach(url => {
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  });
}

/**
 * Creates a comprehensive avatar data object for components
 */
export interface AvatarData {
  url: string | null;
  initials: string;
  hasImage: boolean;
  config: AvatarConfig;
}

export function createAvatarData(profile: UserProfile | null, context: string): AvatarData {
  return {
    url: getAvatarUrl(profile, context),
    initials: getUserInitials(profile),
    hasImage: hasAvatar(profile),
    config: getAvatarConfig(context)
  };
}

/**
 * Validates avatar URLs and removes broken ones
 */
export async function validateAvatarUrls(profile: UserProfile): Promise<{
  thumbnail: boolean;
  medium: boolean;
  full: boolean;
  legacy: boolean;
}> {
  const checkUrl = async (url: string | null): Promise<boolean> => {
    if (!url) return false;
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  };

  const [thumbnail, medium, full, legacy] = await Promise.all([
    checkUrl(profile.avatar_thumbnail_url),
    checkUrl(profile.avatar_medium_url),
    checkUrl(profile.avatar_full_url),
    checkUrl(profile.avatar_url)
  ]);

  return { thumbnail, medium, full, legacy };
}

/**
 * Migration utility: Populates missing avatar sizes from existing avatar_url
 * This is useful for users who uploaded avatars before the multi-tier system
 */
export function needsAvatarMigration(profile: UserProfile): boolean {
  return !!(
    profile.avatar_url && // Has legacy avatar
    (!profile.avatar_thumbnail_url || !profile.avatar_medium_url || !profile.avatar_full_url) // Missing new sizes
  );
}

/**
 * Gets fallback avatar URL chain for progressive loading
 */
export function getAvatarFallbackChain(profile: UserProfile | null, preferredSize: AvatarSize): string[] {
  if (!profile) return [];

  const urls: (string | null)[] = [];
  
  switch (preferredSize) {
    case 'thumbnail':
      urls.push(
        profile.avatar_thumbnail_url,
        profile.avatar_medium_url,
        profile.avatar_full_url,
        profile.avatar_url
      );
      break;
    
    case 'medium':
      urls.push(
        profile.avatar_medium_url,
        profile.avatar_full_url,
        profile.avatar_thumbnail_url,
        profile.avatar_url
      );
      break;
    
    case 'full':
      urls.push(
        profile.avatar_full_url,
        profile.avatar_medium_url,
        profile.avatar_thumbnail_url,
        profile.avatar_url
      );
      break;
  }

  return urls.filter((url): url is string => !!url);
}
