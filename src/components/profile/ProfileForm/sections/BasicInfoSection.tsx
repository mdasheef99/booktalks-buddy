/**
 * BasicInfoSection Component
 * Handles username (read-only), display name, and bio fields
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import AvatarSelector from '@/components/profile/AvatarSelector';

interface BasicInfoSectionProps {
  username: string;
  displayName: string;
  bio: string;
  onDisplayNameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  bioCharLimit?: number;
  // Avatar props
  avatarUrl: string;
  avatarThumbnailUrl: string;
  avatarMediumUrl: string;
  avatarFullUrl: string;
  onAvatarChange: (url: string) => void;
  onAvatarUrlsChange?: (urls: { avatarUrl: string; avatarThumbnailUrl: string; avatarMediumUrl: string; avatarFullUrl: string; }) => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  username,
  displayName,
  bio,
  onDisplayNameChange,
  onBioChange,
  bioCharLimit = 500,
  avatarUrl,
  avatarThumbnailUrl,
  avatarMediumUrl,
  avatarFullUrl,
  onAvatarChange,
  onAvatarUrlsChange
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-bookconnect-brown">Basic Information</h3>

      {/* Profile Picture Section */}
      <div className="space-y-2">
        <Label className="text-bookconnect-brown">Profile Picture</Label>
        <div className="flex flex-col items-center space-y-3">
          <AvatarSelector
            currentAvatarUrl={avatarUrl}
            onAvatarChange={onAvatarChange}
            onAvatarUrlsChange={onAvatarUrlsChange}
            userProfile={{
              displayname: displayName,
              username,
              email: '',
              avatar_url: avatarUrl,
              avatar_thumbnail_url: avatarThumbnailUrl,
              avatar_medium_url: avatarMediumUrl,
              avatar_full_url: avatarFullUrl
            }}
          />
          <p className="text-xs text-gray-500 text-center max-w-md">
            Upload a profile picture to help others recognize you. Supports JPEG, PNG, WebP, and GIF formats up to 5MB.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Username - Read Only */}
        <div className="space-y-2">
          <Label htmlFor="username" className="text-bookconnect-brown">
            Username
          </Label>
          <div className="relative">
            <Input
              id="username"
              value={username}
              readOnly
              disabled
              className="font-mono bg-gray-50 text-gray-600 border-gray-300 cursor-not-allowed"
              aria-describedby="username-help"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-xs text-gray-500" aria-hidden="true">
                Read-only
              </span>
            </div>
          </div>
          <p id="username-help" className="text-xs text-gray-500">
            Username cannot be changed after account creation
          </p>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="displayName" className="text-bookconnect-brown">
            Display Name
          </Label>
          <Input
            id="displayName"
            placeholder="Your public display name"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            className="font-serif border-bookconnect-brown/30 focus:ring-bookconnect-sage"
            aria-describedby="displayname-help"
          />
          <p id="displayname-help" className="text-xs text-gray-500">
            This is how others will see your name
          </p>
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="bio" className="text-bookconnect-brown">
            Bio
          </Label>
          <span 
            className={`text-xs ${bio.length > bioCharLimit ? 'text-red-500' : 'text-gray-500'}`}
            aria-live="polite"
          >
            {bio.length}/{bioCharLimit}
          </span>
        </div>
        <Textarea
          id="bio"
          placeholder="Tell us about yourself and your reading interests..."
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          rows={4}
          className="font-serif resize-none border-bookconnect-brown/30 focus:ring-bookconnect-sage"
          aria-describedby="bio-help"
          maxLength={bioCharLimit}
        />
        <p id="bio-help" className="text-xs text-gray-500">
          Share your reading interests, favorite books, or what you're looking for in a book club
        </p>
        {bio.length > bioCharLimit && (
          <p className="text-xs text-red-500" role="alert">
            Bio exceeds the {bioCharLimit} character limit
          </p>
        )}
      </div>
    </div>
  );
};

export default BasicInfoSection;
