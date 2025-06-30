/**
 * Enhanced SmartAvatar with improved reliability and sync integration
 * Provides robust avatar display with fallback mechanisms and cache awareness
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { createAvatarData, getAvatarFallbackChain, type AvatarSize } from '@/utils/avatarUtils';
import { ProfileCacheManager } from '@/lib/sync/ProfileCacheManager';
import type { UserProfile } from '@/services/profileService';

export interface EnhancedSmartAvatarProps {
  /** User profile data */
  profile: UserProfile | null;
  
  /** Display context (determines size and behavior) */
  context: string;
  
  /** Custom size override */
  size?: AvatarSize;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Alt text for accessibility */
  alt?: string;
  
  /** Whether to show online status indicator */
  showStatus?: boolean;
  
  /** Online status */
  isOnline?: boolean;
  
  /** Click handler */
  onClick?: () => void;
  
  /** Whether the avatar should be clickable */
  clickable?: boolean;
  
  /** Enable retry mechanism for failed images */
  enableRetry?: boolean;
  
  /** Maximum retry attempts */
  maxRetries?: number;
  
  /** Custom loading placeholder */
  loadingPlaceholder?: React.ReactNode;
  
  /** Enable cache invalidation listening */
  enableCacheInvalidation?: boolean;
}

const EnhancedSmartAvatar: React.FC<EnhancedSmartAvatarProps> = ({
  profile,
  context,
  size: sizeOverride,
  className,
  alt,
  showStatus = false,
  isOnline = false,
  onClick,
  clickable = false,
  enableRetry = true,
  maxRetries = 3,
  loadingPlaceholder,
  enableCacheInvalidation = true
}) => {
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [cacheKey, setCacheKey] = useState(0); // Force re-render on cache invalidation

  // Get avatar data for the context
  const avatarData = createAvatarData(profile, context);
  
  // Override size if provided
  const finalSize = sizeOverride || avatarData.config.size;
  
  // Get fallback chain for progressive loading
  const fallbackChain = getAvatarFallbackChain(profile, finalSize);
  
  // Current image URL to display
  const currentImageUrl = fallbackChain[currentImageIndex];

  // Reset state when profile changes
  useEffect(() => {
    setImageError(false);
    setCurrentImageIndex(0);
    setRetryCount(0);
    setIsLoading(false);
  }, [profile?.id, profile?.avatar_url, profile?.avatar_thumbnail_url, profile?.avatar_medium_url, profile?.avatar_full_url]);

  // Cache invalidation listener
  useEffect(() => {
    if (!enableCacheInvalidation || !profile?.id) return;

    const unsubscribe = ProfileCacheManager.addCacheInvalidationListener((userId, reason) => {
      if (userId === profile.id && reason === 'AVATAR_UPLOAD') {
        console.log('Avatar cache invalidated, refreshing display for user:', userId);
        
        // Force re-render by updating cache key
        setCacheKey(prev => prev + 1);
        
        // Reset image state
        setImageError(false);
        setCurrentImageIndex(0);
        setRetryCount(0);
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, [profile?.id, enableCacheInvalidation]);

  // Enhanced image error handling with retry logic
  const handleImageError = useCallback(() => {
    console.warn('Avatar image failed to load:', {
      url: currentImageUrl,
      userId: profile?.id,
      attempt: currentImageIndex + 1,
      retryCount
    });

    // Try next image in fallback chain
    if (currentImageIndex < fallbackChain.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
      return;
    }

    // If we've exhausted the fallback chain, try retry if enabled
    if (enableRetry && retryCount < maxRetries) {
      console.log(`Retrying avatar load (attempt ${retryCount + 1}/${maxRetries})`);
      setRetryCount(prev => prev + 1);
      setCurrentImageIndex(0); // Start from the beginning
      
      // Add a small delay before retry
      setTimeout(() => {
        setCacheKey(prev => prev + 1);
      }, 1000 * (retryCount + 1)); // Exponential backoff
      
      return;
    }

    // All attempts failed, show fallback
    setImageError(true);
  }, [currentImageUrl, currentImageIndex, fallbackChain.length, enableRetry, retryCount, maxRetries, profile?.id]);

  // Handle image load start
  const handleImageLoadStart = useCallback(() => {
    setIsLoading(true);
  }, []);

  // Handle successful image load
  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setImageError(false);
  }, []);

  // Determine if avatar should be clickable
  const isClickable = clickable && onClick;

  // Build avatar classes
  const avatarClasses = cn(
    avatarData.config.className,
    {
      'cursor-pointer hover:opacity-80 transition-opacity': isClickable,
      'opacity-50': isLoading && !imageError
    },
    className
  );

  // Status indicator
  const statusIndicator = showStatus && (
    <div 
      className={cn(
        "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
        isOnline ? "bg-green-500" : "bg-gray-400"
      )}
    />
  );

  // Loading placeholder
  const loadingContent = loadingPlaceholder || (
    <div className="animate-pulse bg-gray-200 rounded-full w-full h-full" />
  );

  return (
    <div className="relative inline-block">
      <Avatar 
        className={avatarClasses}
        onClick={isClickable ? onClick : undefined}
        key={cacheKey} // Force re-render on cache invalidation
      >
        {!imageError && currentImageUrl ? (
          <AvatarImage 
            src={currentImageUrl}
            alt={alt || `${profile?.displayname || profile?.username || 'User'}'s avatar`}
            onError={handleImageError}
            onLoadStart={handleImageLoadStart}
            onLoad={handleImageLoad}
          />
        ) : null}
        
        {isLoading && !imageError ? loadingContent : null}
        
        <AvatarFallback 
          className={cn(
            "bg-bookconnect-terracotta/20 text-bookconnect-terracotta font-medium",
            {
              'text-xs': avatarData.config.width <= 32,
              'text-sm': avatarData.config.width > 32 && avatarData.config.width <= 48,
              'text-base': avatarData.config.width > 48 && avatarData.config.width <= 64,
              'text-lg': avatarData.config.width > 64,
            }
          )}
        >
          {avatarData.initials}
        </AvatarFallback>
      </Avatar>
      
      {statusIndicator}
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && imageError && (
        <div className="absolute -bottom-6 left-0 text-xs text-red-500 whitespace-nowrap">
          Failed after {retryCount} retries
        </div>
      )}
    </div>
  );
};

export default EnhancedSmartAvatar;

// Re-export for backward compatibility
export { EnhancedSmartAvatar as ProfileAvatar };

/**
 * Hook for avatar cache management
 */
export function useAvatarCache(userId: string | null) {
  const [cacheVersion, setCacheVersion] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = ProfileCacheManager.addCacheInvalidationListener((invalidatedUserId, reason) => {
      if (invalidatedUserId === userId && reason === 'AVATAR_UPLOAD') {
        setCacheVersion(prev => prev + 1);
      }
    });

    return unsubscribe;
  }, [userId]);

  const invalidateCache = useCallback(async () => {
    if (userId) {
      await ProfileCacheManager.invalidateUserProfile(userId);
    }
  }, [userId]);

  return {
    cacheVersion,
    invalidateCache
  };
}

/**
 * Avatar preloader utility
 */
export class AvatarPreloader {
  private static preloadedUrls = new Set<string>();

  static preloadAvatar(profile: UserProfile | null): void {
    if (!profile) return;

    const urls = [
      profile.avatar_thumbnail_url,
      profile.avatar_medium_url,
      profile.avatar_full_url,
      profile.avatar_url
    ].filter((url): url is string => !!url && !this.preloadedUrls.has(url));

    urls.forEach(url => {
      const img = new Image();
      img.onload = () => this.preloadedUrls.add(url);
      img.onerror = () => console.warn('Failed to preload avatar:', url);
      img.src = url;
    });
  }

  static preloadAvatars(profiles: UserProfile[]): void {
    profiles.forEach(profile => this.preloadAvatar(profile));
  }

  static clearPreloadCache(): void {
    this.preloadedUrls.clear();
  }
}
