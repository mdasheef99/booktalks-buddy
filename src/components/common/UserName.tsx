import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserProfile, UserProfile } from '@/services/profileService';
import UserTierBadge from '@/components/common/UserTierBadge';
import { formatUserIdentity } from '@/utils/usernameValidation';
import { useAuth } from '@/contexts/AuthContext';
import { convertTierForUI, shouldShowTierBadge } from '@/lib/utils/tierUtils';

interface UserNameProps {
  userId: string;
  linkToProfile?: boolean;
  className?: string;
  withRole?: string;
  showTierBadge?: boolean;
  displayFormat?: 'full' | 'display-primary' | 'username-primary';
  showUsername?: boolean; // Force show username even when display name exists
}

const UserName: React.FC<UserNameProps> = ({
  userId,
  linkToProfile = false,
  className = '',
  withRole,
  showTierBadge = true,
  displayFormat = 'display-primary',
  showUsername = false
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

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

  // Enhanced display name logic with dual-identity support
  const renderUserIdentity = () => {
    if (loading) return <span className="font-medium">Loading...</span>;

    if (!profile) return <span className="font-medium">User {userId.substring(0, 4)}</span>;

    const hasDisplayName = profile.displayname && profile.displayname.trim();
    const username = profile.username || '';

    // Handle different display formats
    switch (displayFormat) {
      case 'full':
        if (hasDisplayName) {
          return (
            <>
              <span className="font-medium">{profile.displayname}</span>
              <span className="text-gray-500 text-sm">(@{username})</span>
            </>
          );
        } else {
          return <span className="font-medium">@{username}</span>;
        }

      case 'username-primary':
        if (hasDisplayName) {
          return (
            <>
              <span className="font-medium">{username}</span>
              <span className="text-gray-500 text-sm">({profile.displayname})</span>
            </>
          );
        } else {
          return <span className="font-medium">{username}</span>;
        }

      case 'display-primary':
      default:
        return <span className="font-medium">{hasDisplayName ? profile.displayname : username}</span>;
    }
  };

  const content = (
    <span className={`flex items-center gap-1 ${className}`}>
      <span className="flex items-center gap-1">
        {/* User identity display */}
        {renderUserIdentity()}

        {/* Role indicator */}
        {withRole && (
          <span className="text-gray-500 text-sm ml-1">
            ({withRole})
          </span>
        )}
      </span>

      {/* Tier badge */}
      {showTierBadge && shouldShowTierBadge(profile?.membership_tier) && (
        <UserTierBadge tier={convertTierForUI(profile?.membership_tier) || 'member'} size="sm" />
      )}
    </span>
  );

  // Check if this is the current user's own profile
  const isCurrentUser = user?.id === userId;

  if (linkToProfile && profile?.username && !isCurrentUser) {
    // Use username for profile links (more stable than ID)
    // Only make it clickable if it's NOT the current user
    return (
      <Link
        to={`/user/${profile.username}`}
        className="hover:underline text-bookconnect-brown"
        title={`View ${profile.displayname || profile.username}'s profile`}
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default UserName;
