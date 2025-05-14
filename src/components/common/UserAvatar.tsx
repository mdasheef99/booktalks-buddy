import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getUserProfile, UserProfile } from '@/services/profileService';

interface UserAvatarProps {
  userId: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  userId,
  size = 'md',
  showTooltip = true,
  className = ''
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userProfile = await getUserProfile(userId);
        setProfile(userProfile);
      } catch (error) {
        console.error(`Error fetching profile for ${userId}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  // Size classes
  const sizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  // Get initials for fallback
  const getInitials = () => {
    if (!profile || !profile.username) return userId.substring(0, 2).toUpperCase();

    const nameParts = profile.username.split(' ');
    if (nameParts.length === 1) return nameParts[0].substring(0, 2).toUpperCase();

    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  const avatar = (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage
        src={profile?.avatar_url || ''}
        alt={profile?.username || 'User'}
      />
      <AvatarFallback className="bg-bookconnect-terracotta/20 text-bookconnect-terracotta">
        {loading ? '...' : getInitials()}
      </AvatarFallback>
    </Avatar>
  );

  if (showTooltip && profile) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {avatar}
          </TooltipTrigger>
          <TooltipContent>
            <p>{profile.username || 'Unknown User'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return avatar;
};

export default UserAvatar;
