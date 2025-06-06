import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { createAvatarData, getAvatarFallbackChain, type AvatarSize } from '@/utils/avatarUtils';
import type { UserProfile } from '@/services/profileService';

/**
 * SmartAvatar - Context-aware avatar component that automatically selects
 * the optimal image size and provides progressive loading with fallbacks
 */

export interface SmartAvatarProps {
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
}

const SmartAvatar: React.FC<SmartAvatarProps> = ({
  profile,
  context,
  size: sizeOverride,
  className,
  alt,
  showStatus = false,
  isOnline = false,
  onClick,
  clickable = false
}) => {
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get avatar data for the context
  const avatarData = createAvatarData(profile, context);
  
  // Override size if provided
  const finalSize = sizeOverride || avatarData.config.size;
  
  // Get fallback chain for progressive loading
  const fallbackChain = getAvatarFallbackChain(profile, finalSize);
  
  // Current image URL to display
  const currentImageUrl = fallbackChain[currentImageIndex];
  
  // Handle image load error - try next in fallback chain
  const handleImageError = () => {
    if (currentImageIndex < fallbackChain.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    } else {
      setImageError(true);
    }
  };

  // Reset error state when profile changes
  React.useEffect(() => {
    setImageError(false);
    setCurrentImageIndex(0);
  }, [profile?.id]);

  // Determine if avatar should be clickable
  const isClickable = clickable || !!onClick;

  // Build CSS classes
  const avatarClasses = cn(
    avatarData.config.className,
    {
      'cursor-pointer hover:opacity-80 transition-opacity': isClickable,
      'ring-2 ring-green-500': showStatus && isOnline,
      'ring-2 ring-gray-300': showStatus && !isOnline,
    },
    className
  );

  // Status indicator size based on avatar size
  const getStatusSize = () => {
    const width = avatarData.config.width;
    if (width <= 32) return 'h-2 w-2';
    if (width <= 48) return 'h-3 w-3';
    if (width <= 64) return 'h-4 w-4';
    return 'h-5 w-5';
  };

  return (
    <div className="relative inline-block">
      <Avatar 
        className={avatarClasses}
        onClick={isClickable ? onClick : undefined}
      >
        {!imageError && currentImageUrl ? (
          <AvatarImage 
            src={currentImageUrl}
            alt={alt || `${profile?.displayname || profile?.username || 'User'}'s avatar`}
            onError={handleImageError}
          />
        ) : null}
        
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

      {/* Online status indicator */}
      {showStatus && (
        <div 
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-white",
            getStatusSize(),
            {
              'bg-green-500': isOnline,
              'bg-gray-400': !isOnline,
            }
          )}
        />
      )}
    </div>
  );
};

export default SmartAvatar;

/**
 * Predefined SmartAvatar variants for common use cases
 */

export const NavAvatar: React.FC<Omit<SmartAvatarProps, 'context'>> = (props) => (
  <SmartAvatar {...props} context="nav" />
);

export const NavAvatarLarge: React.FC<Omit<SmartAvatarProps, 'context'>> = (props) => (
  <SmartAvatar {...props} context="navLarge" />
);

export const ListAvatar: React.FC<Omit<SmartAvatarProps, 'context'>> = (props) => (
  <SmartAvatar {...props} context="listItem" />
);

export const CardAvatar: React.FC<Omit<SmartAvatarProps, 'context'>> = (props) => (
  <SmartAvatar {...props} context="card" />
);

export const CardAvatarLarge: React.FC<Omit<SmartAvatarProps, 'context'>> = (props) => (
  <SmartAvatar {...props} context="cardLarge" />
);

export const ProfileAvatar: React.FC<Omit<SmartAvatarProps, 'context'>> = (props) => (
  <SmartAvatar {...props} context="profileHeader" />
);

export const ProfileAvatarLarge: React.FC<Omit<SmartAvatarProps, 'context'>> = (props) => (
  <SmartAvatar {...props} context="profileLarge" />
);

export const ProfileAvatarXL: React.FC<Omit<SmartAvatarProps, 'context'>> = (props) => (
  <SmartAvatar {...props} context="profileXL" />
);

export const MessageAvatar: React.FC<Omit<SmartAvatarProps, 'context'>> = (props) => (
  <SmartAvatar {...props} context="message" />
);

export const CommentAvatar: React.FC<Omit<SmartAvatarProps, 'context'>> = (props) => (
  <SmartAvatar {...props} context="comment" />
);

export const MentionAvatar: React.FC<Omit<SmartAvatarProps, 'context'>> = (props) => (
  <SmartAvatar {...props} context="mention" />
);

/**
 * Avatar group component for displaying multiple avatars
 */
export interface AvatarGroupProps {
  profiles: UserProfile[];
  context: string;
  max?: number;
  className?: string;
  onOverflowClick?: () => void;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  profiles,
  context,
  max = 3,
  className,
  onOverflowClick
}) => {
  const visibleProfiles = profiles.slice(0, max);
  const overflowCount = profiles.length - max;

  return (
    <div className={cn("flex -space-x-2", className)}>
      {visibleProfiles.map((profile, index) => (
        <SmartAvatar
          key={profile.id}
          profile={profile}
          context={context}
          className="ring-2 ring-white"
          style={{ zIndex: visibleProfiles.length - index }}
        />
      ))}
      
      {overflowCount > 0 && (
        <div 
          className={cn(
            "flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-medium ring-2 ring-white cursor-pointer hover:bg-gray-300",
            // Use same size as context
            createAvatarData(null, context).config.className
          )}
          onClick={onOverflowClick}
        >
          +{overflowCount}
        </div>
      )}
    </div>
  );
};

/**
 * Avatar with tooltip showing user info
 */
export interface AvatarWithTooltipProps extends SmartAvatarProps {
  showTooltip?: boolean;
  tooltipContent?: React.ReactNode;
}

export const AvatarWithTooltip: React.FC<AvatarWithTooltipProps> = ({
  showTooltip = true,
  tooltipContent,
  profile,
  ...props
}) => {
  if (!showTooltip) {
    return <SmartAvatar profile={profile} {...props} />;
  }

  const defaultTooltipContent = profile ? (
    <div className="text-sm">
      <div className="font-medium">{profile.displayname || profile.username}</div>
      {profile.bio && <div className="text-gray-500 text-xs mt-1">{profile.bio}</div>}
    </div>
  ) : null;

  return (
    <div className="group relative">
      <SmartAvatar profile={profile} {...props} />
      
      {/* Simple tooltip - you can replace with a proper tooltip component */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {tooltipContent || defaultTooltipContent}
      </div>
    </div>
  );
};
