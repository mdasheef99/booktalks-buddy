import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, PlusCircle, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { UserMetadata, READING_FREQUENCY_LABELS } from './types';
import UserTierBadge from '@/components/common/UserTierBadge';
import { ProfileAvatarLarge } from '@/components/ui/SmartAvatar';

interface ProfileHeaderProps {
  user: any;
  userMetadata: UserMetadata;
  onEditProfile: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  userMetadata,
  onEditProfile
}) => {
  const navigate = useNavigate();
  const [bioExpanded, setBioExpanded] = useState(false);



  return (
    <Card className="mb-6 overflow-hidden border-bookconnect-brown/20 shadow-md">
      <div className="h-32 bg-bookconnect-cream relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/book-pattern.png')] opacity-20"></div>
      </div>
      <CardContent className="pt-0 relative">
        {/* Position buttons in top right corner, horizontally adjacent */}
        <div className="absolute top-0 right-0 flex flex-row gap-2 z-10 p-2">
          <Button
            variant="outline"
            size="sm"
            className="border-bookconnect-brown/30 text-bookconnect-brown hover:bg-bookconnect-cream bg-white"
            onClick={() => navigate('/messages')}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Messages
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="border-bookconnect-brown/30 text-bookconnect-brown hover:bg-bookconnect-cream bg-white"
            onClick={onEditProfile}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>

          <Button
            variant="default"
            size="sm"
            className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white"
            onClick={() => navigate('/book-club/new')}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Book Club
          </Button>
        </div>

        {/* Profile layout with avatar in top left */}
        <div className="flex flex-col">
          {/* Avatar and name section */}
          <div className="flex items-start -mt-16 mb-6">
            <ProfileAvatarLarge
              profile={userMetadata as any}
              className="border-4 border-white shadow-lg"
            />

            <div className="ml-4 mt-4">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-serif text-bookconnect-brown">
                  {userMetadata.display_name || userMetadata.username || user.email?.split('@')[0] || 'BookClub Member'}
                </h1>
                {user.membership_tier && (
                  <UserTierBadge tier={user.membership_tier} size="md" />
                )}
              </div>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-600">Member since {new Date(user.created_at || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Bio section below profile info */}
          {userMetadata.bio && (
            <div className="mt-2 max-w-full">
              <div className="text-gray-700 font-serif break-words whitespace-pre-wrap">
                {userMetadata.bio.length > 300 && !bioExpanded
                  ? `${userMetadata.bio.substring(0, 300)}...`
                  : userMetadata.bio}
              </div>
              {userMetadata.bio.length > 300 && (
                <button
                  onClick={() => setBioExpanded(!bioExpanded)}
                  className="text-bookconnect-terracotta hover:text-bookconnect-terracotta/80 text-sm flex items-center mt-1"
                >
                  {bioExpanded ? (
                    <>
                      Read less <ChevronUp className="h-3 w-3 ml-1" />
                    </>
                  ) : (
                    <>
                      Read more <ChevronDown className="h-3 w-3 ml-1" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {userMetadata.reading_frequency && (
            <Badge variant="outline" className="mt-3 bg-bookconnect-cream text-bookconnect-brown border-bookconnect-brown/20 self-start">
              {READING_FREQUENCY_LABELS[userMetadata.reading_frequency] || userMetadata.reading_frequency}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileHeader;
