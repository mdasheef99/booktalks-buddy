import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookClubProfile, uploadProfileAvatar } from '@/lib/api/profile';
import { Edit, Upload } from 'lucide-react';
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

  return (
    <Card className="mb-6 overflow-hidden">
      <div className="h-32 bg-gradient-to-r from-bookconnect-brown to-bookconnect-terracotta" />
      <CardContent className="pt-0 relative">
        <div className="flex flex-col md:flex-row gap-6 -mt-12 items-start md:items-end">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-white">
              <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
              <AvatarFallback className="text-xl bg-bookconnect-terracotta/20 text-bookconnect-terracotta">
                {getInitials()}
              </AvatarFallback>
            </Avatar>

            {isCurrentUser && (
              <div className="absolute bottom-0 right-0">
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="h-8 w-8 rounded-full bg-bookconnect-brown text-white flex items-center justify-center hover:bg-bookconnect-brown/90 transition-colors">
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

          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profile.username}</h1>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <p className="text-sm text-gray-500">Member since {formatJoinDate()}</p>

            {profile.bio && (
              <p className="mt-2 text-gray-700">{profile.bio}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {profile.favorite_genres?.map((genre, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-bookconnect-cream text-bookconnect-brown text-xs rounded-full"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>

          {isCurrentUser && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={onEditProfile}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BookClubProfileHeader;
