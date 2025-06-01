import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookClubProfile, uploadProfileAvatar } from '@/lib/api/profile';
import { Edit, Upload, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useMessagingButton } from '@/components/messaging/hooks/useMessaging';
import { ProfileAvatarLarge } from '@/components/ui/SmartAvatar';
import { ProfileImageModal } from './ProfileImageModal';
import { hasAvatar } from '@/utils/avatarUtils';

interface BookClubProfileHeaderProps {
  profile: BookClubProfile;
  isCurrentUser: boolean;
  onEditProfile: () => void;
  onProfileUpdated: () => void;
}

const BookClubProfileHeader: React.FC<BookClubProfileHeaderProps> = ({
  profile,
  isCurrentUser,
  onEditProfile,
  onProfileUpdated
}) => {
  const [uploading, setUploading] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Messaging functionality for other users' profiles
  const messagingButton = useMessagingButton(isCurrentUser ? undefined : profile.username);

  // Check if user has a profile image that can be viewed
  const hasProfileImage = hasAvatar(profile as any);

  // Handle avatar click for image viewing
  const handleAvatarClick = () => {
    if (!isCurrentUser && hasProfileImage) {
      setImageModalOpen(true);
    }
  };



  // Format join date
  const formatJoinDate = () => {
    if (!profile.created_at) return 'Unknown';
    return new Date(profile.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    setUploading(true);
    try {
      await uploadProfileAvatar(profile.id, file);
      toast.success('Profile picture updated');
      onProfileUpdated();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  // State for bio expansion
  const [bioExpanded, setBioExpanded] = useState(false);
  const maxBioLength = 300; // Maximum characters to show before "Read more"
  const bioIsTruncated = profile.bio && profile.bio.length > maxBioLength;

  const toggleBioExpansion = () => {
    setBioExpanded(!bioExpanded);
  };



  return (
    <Card className="mb-6 overflow-hidden shadow-md">
      <div className="h-32 bg-gradient-to-r from-bookconnect-cream to-amber-100 relative">
        {/* Position buttons in top right */}
        <div className="absolute top-4 right-4 flex gap-2">
          {/* Edit Profile button - only for current user */}
          {isCurrentUser && (
            <Button
              variant="outline"
              size="sm"
              className="bg-white hover:bg-gray-100 shadow-sm"
              onClick={onEditProfile}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}

          {/* Message User button - only for other users */}
          {!isCurrentUser && (
            <Button
              variant={messagingButton.variant}
              size="sm"
              className="bg-white hover:bg-gray-100 shadow-sm"
              onClick={messagingButton.onClick}
              disabled={messagingButton.disabled}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {messagingButton.children}
            </Button>
          )}
        </div>
      </div>
      <CardContent className="pt-0 relative">
        {/* Mobile-first responsive layout */}
        <div className="px-4 pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
            {/* Avatar positioned for mobile-first design with responsive sizing */}
            <div className="relative group">
              <ProfileAvatarLarge
                profile={profile as any}
                className={`w-20 h-20 sm:w-24 sm:h-24 border-4 border-white shadow-lg transition-all duration-200 ${
                  !isCurrentUser && hasProfileImage
                    ? 'cursor-pointer hover:shadow-xl hover:scale-105 hover:border-bookconnect-terracotta/50'
                    : ''
                }`}
                onClick={handleAvatarClick}
                clickable={!isCurrentUser && hasProfileImage}
                alt={hasProfileImage ? `Click to view ${profile?.displayname || profile?.username || 'user'}'s profile picture` : undefined}
              />

              {/* Clickable indicator tooltip */}
              {!isCurrentUser && hasProfileImage && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  Click to view full size
                </div>
              )}

              {/* Only show upload option for current user with improved mobile UX */}
              {isCurrentUser && (
                <div className="absolute bottom-0 right-0">
                  <label
                    htmlFor="avatar-upload"
                    className="cursor-pointer group"
                    aria-label="Upload new profile picture"
                  >
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-bookconnect-brown text-white flex items-center justify-center hover:bg-bookconnect-brown/90 transition-all duration-200 shadow-lg group-hover:shadow-xl group-active:scale-95">
                      {uploading ? (
                        <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:scale-110" />
                      )}
                    </div>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                      aria-describedby="avatar-upload-help"
                    />
                  </label>

                  {/* Hidden help text for screen readers */}
                  <div id="avatar-upload-help" className="sr-only">
                    Upload a new profile picture. Supported formats: JPEG, PNG, WebP, GIF. Maximum size: 2MB.
                  </div>
                </div>
              )}
            </div>

            {/* Profile info section with better mobile layout */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-bookconnect-brown truncate">{profile.username}</h1>
              {/* Only show email for current user */}
              {isCurrentUser && <p className="text-sm text-gray-500 truncate">{profile.email}</p>}
              <p className="text-sm text-gray-500">Member since {formatJoinDate()}</p>
            </div>

            {/* Action buttons positioned for mobile */}
            <div className="flex gap-2 w-full sm:w-auto">
              {/* Edit Profile button - only for current user */}
              {isCurrentUser && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-gray-100 shadow-sm flex-1 sm:flex-none"
                  onClick={onEditProfile}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}

              {/* Message button - only for other users */}
              {!isCurrentUser && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-gray-100 shadow-sm flex-1 sm:flex-none"
                  onClick={messagingButton.onClick}
                  disabled={messagingButton.disabled}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {messagingButton.children}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Profile content section with improved spacing */}
        <div className="px-4 pb-4 space-y-4">
          {/* Bio with Read More/Less functionality */}
          {profile.bio && (
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">About</h3>
              <div className="text-gray-700 break-words whitespace-pre-wrap bg-bookconnect-cream/30 p-3 rounded-md text-sm">
                {bioIsTruncated && !bioExpanded
                  ? `${profile.bio.substring(0, maxBioLength)}...`
                  : profile.bio}
              </div>
              {bioIsTruncated && (
                <button
                  onClick={toggleBioExpansion}
                  aria-expanded={bioExpanded}
                  aria-controls="user-bio"
                  className="text-bookconnect-terracotta hover:text-bookconnect-terracotta/80 text-sm flex items-center mt-2"
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

          {/* Reading preferences with improved mobile layout */}
          {profile.favorite_genres && profile.favorite_genres.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Favorite Genres</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.favorite_genres.map((genre, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 bg-bookconnect-cream text-bookconnect-brown text-xs rounded-full shadow-sm border border-bookconnect-brown/10"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Favorite Authors with improved mobile layout */}
          {profile.favorite_authors && profile.favorite_authors.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Favorite Authors</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.favorite_authors.map((author, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 bg-bookconnect-cream text-bookconnect-brown text-xs rounded-full shadow-sm border border-bookconnect-brown/10"
                  >
                    {author}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Profile Image Modal */}
      <ProfileImageModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        profile={profile as any}
      />
    </Card>
  );
};

export default BookClubProfileHeader;
