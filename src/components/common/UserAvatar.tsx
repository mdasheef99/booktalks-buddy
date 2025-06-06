import React, { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getUserProfile, UserProfile } from '@/services/profileService';
import SmartAvatar from '@/components/ui/SmartAvatar';

interface UserAvatarProps {
  userId: string;
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
  showStatus?: boolean;
  isOnline?: boolean;
  onClick?: () => void;
  clickable?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  userId,
  size = 'md',
  showTooltip = true,
  className = '',
  showStatus = false,
  isOnline = false,
  onClick,
  clickable = false
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

  // Map legacy sizes to SmartAvatar contexts
  const sizeToContext = {
    xxs: 'mention',
    xs: 'comment',
    sm: 'message',
    md: 'listItem',
    lg: 'card'
  };

  const context = sizeToContext[size];

  const avatar = (
    <SmartAvatar
      profile={profile}
      context={context}
      className={className}
      showStatus={showStatus}
      isOnline={isOnline}
      onClick={onClick}
      clickable={clickable}
      alt={profile?.username || 'User'}
    />
  );

  if (showTooltip && profile) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {avatar}
          </TooltipTrigger>
          <TooltipContent>
            <p>{profile.displayname ? `${profile.displayname} (@${profile.username})` : profile.username || 'Unknown User'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return avatar;
};

export default UserAvatar;
