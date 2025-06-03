/**
 * Refactored ProfileForm Component
 * Main form component that orchestrates the profile editing sections
 * Maintains the fixed username loading from database and read-only behavior
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';

// Import sections
import BasicInfoSection from './sections/BasicInfoSection';
import ReadingPreferencesSection from './sections/ReadingPreferencesSection';
import BookClubPreferencesSection from './sections/BookClubPreferencesSection';

// Import custom hook
import { useProfileFormData } from './hooks/useProfileFormData';

interface ProfileFormProps {
  onCancel: () => void;
  onProfileUpdated: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  onCancel,
  onProfileUpdated
}) => {
  const [saving, setSaving] = useState(false);
  
  // Use custom hook for data management
  const {
    formData,
    isLoading,
    updateDisplayName,
    updateBio,
    updateFavoriteAuthor,
    updateFavoriteGenre,
    updateReadingFrequency,
    addFavoriteAuthor,
    removeFavoriteAuthor,
    addFavoriteGenre,
    removeFavoriteGenre,
    toggleMeetingTime,
    updateAvatarUrls,
    saveProfile
  } = useProfileFormData();

  // Character limits
  const BIO_CHAR_LIMIT = 500;

  // Handle avatar change from AvatarSelector (legacy callback)
  const handleAvatarChange = (url: string) => {
    // This is called for backward compatibility
    // The main avatar URL update happens in handleAvatarUrlsChange
    console.log('Avatar changed (legacy):', url);
  };

  // Handle multi-tier avatar URLs change from AvatarSelector
  const handleAvatarUrlsChange = (urls: { avatarUrl: string; avatarThumbnailUrl: string; avatarMediumUrl: string; avatarFullUrl: string; }) => {
    // Update all avatar URLs when upload completes
    updateAvatarUrls(urls);

    // Force a re-render by updating the form data immediately
    console.log('Avatar URLs updated:', urls);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (formData.bio.length > BIO_CHAR_LIMIT) {
      return; // Error is already shown in BasicInfoSection
    }

    setSaving(true);

    try {
      const success = await saveProfile();
      if (success) {
        onProfileUpdated();
      }
    } finally {
      setSaving(false);
    }
  };

  // Show loading state while data is being loaded
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-center space-x-2 text-bookconnect-brown">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="font-serif">Loading profile data...</span>
        </div>
      </div>
    );
  }

  return (
    <form 
      onSubmit={handleSubmit} 
      className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100"
    >
      {/* Form Header */}
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-serif text-bookconnect-brown">Edit Your Profile</h2>
        <p className="text-sm text-gray-600 mt-1">
          Update your profile information to help others get to know you better
        </p>
      </div>

      {/* Basic Information Section */}
      <BasicInfoSection
        username={formData.username}
        displayName={formData.displayName}
        bio={formData.bio}
        onDisplayNameChange={updateDisplayName}
        onBioChange={updateBio}
        bioCharLimit={BIO_CHAR_LIMIT}
        avatarUrl={formData.avatarUrl}
        avatarThumbnailUrl={formData.avatarThumbnailUrl}
        avatarMediumUrl={formData.avatarMediumUrl}
        avatarFullUrl={formData.avatarFullUrl}
        onAvatarChange={handleAvatarChange}
        onAvatarUrlsChange={handleAvatarUrlsChange}
      />

      {/* Reading Preferences Section */}
      <ReadingPreferencesSection
        favoriteAuthor={formData.favoriteAuthor}
        favoriteAuthors={formData.favoriteAuthors}
        favoriteGenre={formData.favoriteGenre}
        favoriteGenres={formData.favoriteGenres}
        readingFrequency={formData.readingFrequency}
        onFavoriteAuthorChange={updateFavoriteAuthor}
        onAddFavoriteAuthor={addFavoriteAuthor}
        onRemoveFavoriteAuthor={removeFavoriteAuthor}
        onFavoriteGenreChange={addFavoriteGenre}
        onRemoveFavoriteGenre={removeFavoriteGenre}
        onReadingFrequencyChange={updateReadingFrequency}
      />

      {/* BookClub Preferences Section */}
      <BookClubPreferencesSection
        preferredMeetingTimes={formData.preferredMeetingTimes}
        onToggleMeetingTime={toggleMeetingTime}
      />

      {/* Reading List Section */}
      <ReadingListSection />

      {/* Form Actions */}
      <div className="flex justify-between pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="text-bookconnect-brown border-bookconnect-brown/30 hover:bg-bookconnect-cream/30"
          disabled={saving}
        >
          Cancel
        </Button>
        
        <Button
          type="submit"
          disabled={saving || formData.bio.length > BIO_CHAR_LIMIT}
          className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default ProfileForm;
