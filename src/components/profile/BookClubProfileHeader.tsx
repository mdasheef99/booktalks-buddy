import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookClubProfile, uploadProfileAvatar } from '@/lib/api/profile';
import { Edit, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

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

  // Get initials for avatar fallback
  const getInitials = () => {
    if (!profile.username) return '?';

    const nameParts = profile.username.split(' ');
    if (nameParts.length === 1) return nameParts[0].substring(0, 2).toUpperCase();

    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
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

  // Log the isCurrentUser value to debug
  console.log('BookClubProfileHeader - isCurrentUser:', isCurrentUser);

  return (
    <Card className="mb-6 overflow-hidden shadow-md">
      <div className="h-32 bg-gradient-to-r from-bookconnect-cream to-amber-100 relative">
        {/* Position Edit Profile button in top right - only for current user */}
        {isCurrentUser && (
          <div className="absolute top-4 right-4">
            <Button
              variant="outline"
              size="sm"
              className="bg-white hover:bg-gray-100 shadow-sm"
              onClick={onEditProfile}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        )}
      </div>
      <CardContent className="pt-0 relative">
        <div className="flex flex-col md:flex-row gap-6 -mt-16 items-start">
          {/* Avatar positioned in top left */}
          <div className="relative ml-4 md:ml-0">
            <Avatar className="h-24 w-24 border-4 border-white shadow-md">
              <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
              <AvatarFallback className="text-xl bg-bookconnect-terracotta/20 text-bookconnect-terracotta">
                {getInitials()}
              </AvatarFallback>
            </Avatar>

            {/* Only show upload option for current user */}
            {isCurrentUser && (
              <div className="absolute bottom-0 right-0">
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="h-8 w-8 rounded-full bg-bookconnect-brown text-white flex items-center justify-center hover:bg-bookconnect-brown/90 transition-colors shadow-sm">
                    {uploading ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="flex-1 mt-4 md:mt-0">
            <h1 className="text-2xl font-bold text-bookconnect-brown">{profile.username}</h1>
            {/* Only show email for current user */}
            {isCurrentUser && <p className="text-sm text-gray-500">{profile.email}</p>}
            <p className="text-sm text-gray-500">Member since {formatJoinDate()}</p>

            {/* Bio with Read More/Less functionality */}
            {profile.bio && (
              <div className="mt-3">
                <h3 className="text-sm font-medium text-gray-600 mb-1">About</h3>
                <div className="text-gray-700 break-words whitespace-pre-wrap bg-bookconnect-cream/30 p-3 rounded-md">
                  {bioIsTruncated && !bioExpanded
                    ? `${profile.bio.substring(0, maxBioLength)}...`
                    : profile.bio}
                </div>
                {bioIsTruncated && (
                  <button
                    onClick={toggleBioExpansion}
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

            {/* Reading preferences */}
            {profile.favorite_genres && profile.favorite_genres.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Favorite Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.favorite_genres.map((genre, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-bookconnect-cream text-bookconnect-brown text-xs rounded-full shadow-sm"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Favorite Authors */}
            {profile.favorite_authors && profile.favorite_authors.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Favorite Authors</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.favorite_authors.map((author, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-bookconnect-cream text-bookconnect-brown text-xs rounded-full shadow-sm"
                    >
                      {author}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookClubProfileHeader;
