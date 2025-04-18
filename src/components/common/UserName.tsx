import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserProfile, UserProfile } from '@/services/profileService';

interface UserNameProps {
  userId: string;
  linkToProfile?: boolean;
  className?: string;
  withRole?: string;
}

const UserName: React.FC<UserNameProps> = ({
  userId,
  linkToProfile = false,
  className = '',
  withRole
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

  const displayName = loading
    ? 'Loading...'
    : (profile?.displayname || profile?.username || `User ${userId.substring(0, 4)}`);

  const content = (
    <span className={className}>
      {displayName}
      {withRole && (
        <span className="text-gray-500 text-sm ml-1">
          ({withRole})
        </span>
      )}
    </span>
  );

  if (linkToProfile && profile?.id) {
    return (
      <Link
        to={`/profile/${profile.id}`}
        className="hover:underline text-bookconnect-brown"
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default UserName;
