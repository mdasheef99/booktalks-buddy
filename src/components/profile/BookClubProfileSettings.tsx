import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BookClubProfile, updateBookClubProfile } from '@/lib/api/profile';
import { syncUserProfileToDatabase } from '@/lib/syncUserProfile';
import { Settings, X, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import SyncProfilesButton from '@/components/admin/SyncProfilesButton';

interface BookClubProfileSettingsProps {
  profile: BookClubProfile;
  onCancel: () => void;
  onProfileUpdated: () => void;
}

const BookClubProfileSettings: React.FC<BookClubProfileSettingsProps> = ({
  profile,
  onCancel,
  onProfileUpdated
}) => {
  // Username is read-only, not editable
  const username = profile.username || '';
  const [bio, setBio] = useState(profile.bio || '');
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>(profile.favorite_genres || []);
  const [favoriteAuthors, setFavoriteAuthors] = useState<string[]>(profile.favorite_authors || []);
  const [newGenre, setNewGenre] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [saving, setSaving] = useState(false);

  // Add a new genre
  const addGenre = () => {
    if (!newGenre.trim()) return;
    if (favoriteGenres.includes(newGenre.trim())) {
      toast.error('This genre is already in your list');
      return;
    }
    setFavoriteGenres([...favoriteGenres, newGenre.trim()]);
    setNewGenre('');
  };

  // Remove a genre
  const removeGenre = (genre: string) => {
    setFavoriteGenres(favoriteGenres.filter(g => g !== genre));
  };

  // Add a new author
  const addAuthor = () => {
    if (!newAuthor.trim()) return;
    if (favoriteAuthors.includes(newAuthor.trim())) {
      toast.error('This author is already in your list');
      return;
    }
    setFavoriteAuthors([...favoriteAuthors, newAuthor.trim()]);
    setNewAuthor('');
  };

  // Remove an author
  const removeAuthor = (author: string) => {
    setFavoriteAuthors(favoriteAuthors.filter(a => a !== author));
  };

  // Enhanced form submission with atomic operations and error recovery
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Import sync utilities
    const { ProfileSyncError, SyncErrorType, attemptErrorRecovery } = await import('@/lib/sync/ProfileSyncError');
    const { ProfileCacheManager, CacheInvalidationReason } = await import('@/lib/sync/ProfileCacheManager');
    const { validateAndReportSync } = await import('@/lib/sync/ProfileSyncValidator');

    let authUpdateSucceeded = false;
    let dbUpdateSucceeded = false;

    try {
      // Step 1: Update the auth metadata
      try {
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            bio,
            favorite_genres: favoriteGenres,
            favorite_authors: favoriteAuthors
          }
        });

        if (authError) {
          throw ProfileSyncError.fromAuthError(authError, {
            userId: profile.id,
            operation: 'bookclub_profile_auth_update'
          });
        }

        authUpdateSucceeded = true;
        console.log('Auth metadata updated successfully');
      } catch (error) {
        if (error instanceof ProfileSyncError) {
          error.logError();
          const recovered = await attemptErrorRecovery(error);
          if (!recovered) {
            toast.error(error.userMessage);
            setSaving(false);
            return;
          }
          authUpdateSucceeded = true;
        } else {
          throw error;
        }
      }

      // Step 2: Update the users table (username is read-only, not updated)
      try {
        const updatedProfile = await updateBookClubProfile(profile.id, {
          bio,
          favorite_genres: favoriteGenres,
          favorite_authors: favoriteAuthors
        });

        if (!updatedProfile) {
          throw new ProfileSyncError(
            SyncErrorType.DATABASE_UPDATE_FAILED,
            'Failed to update book club profile',
            { userId: profile.id, operation: 'bookclub_profile_db_update' },
            true
          );
        }

        dbUpdateSucceeded = true;
        console.log('Database profile updated successfully');
      } catch (error) {
        if (error instanceof ProfileSyncError) {
          error.logError();
          const recovered = await attemptErrorRecovery(error);
          if (!recovered) {
            // If database update fails but auth succeeded, we have partial failure
            if (authUpdateSucceeded) {
              toast.error('Profile preferences saved, but some changes may not be visible to others. Please try again.');
            } else {
              toast.error(error.userMessage);
            }
            setSaving(false);
            return;
          }
          dbUpdateSucceeded = true;
        } else {
          throw error;
        }
      }

      // Step 3: Invalidate cache after successful updates
      try {
        await ProfileCacheManager.invalidateUserProfile(profile.id, CacheInvalidationReason.PROFILE_UPDATE);
      } catch (cacheError) {
        console.warn('Cache invalidation failed, but profile update succeeded:', cacheError);
        // Don't fail the operation due to cache issues
      }

      // Step 4: Validate sync (non-blocking)
      validateAndReportSync(profile.id).catch(error => {
        console.warn('Post-update sync validation failed:', error);
      });

      toast.success('Profile updated successfully');
      // Pass the updated profile back to the parent
      onProfileUpdated();
    } catch (error) {
      console.error('Error updating profile:', error);

      // Handle unexpected errors
      const syncError = new ProfileSyncError(
        SyncErrorType.PARTIAL_SYNC_FAILURE,
        'Unexpected error during profile update',
        { userId: profile.id, operation: 'bookclub_profile_save', originalError: error as Error },
        true
      );
      syncError.logError();

      // Attempt recovery
      const recovered = await attemptErrorRecovery(syncError);
      if (recovered) {
        toast.success('Profile updated successfully (after recovery)');
        onProfileUpdated();
      } else {
        // Provide specific error message based on what succeeded
        if (authUpdateSucceeded && !dbUpdateSucceeded) {
          toast.error('Profile preferences saved, but some changes may not be visible to others. Please try again.');
        } else if (!authUpdateSucceeded && dbUpdateSucceeded) {
          toast.error('Profile information saved, but preferences may not be updated. Please try again.');
        } else {
          toast.error('Failed to update profile. Please try again.');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-bookconnect-terracotta" />
          Edit Profile
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Username - Read Only */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                id="username"
                value={username}
                readOnly
                disabled
                className="bg-gray-50 text-gray-600 cursor-not-allowed"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-xs text-gray-500">Read-only</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Username cannot be changed after account creation
            </p>
          </div>
          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself and your reading interests..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Favorite Genres */}
          <div className="space-y-2">
            <Label>Favorite Genres</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {favoriteGenres.map((genre, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-bookconnect-cream text-bookconnect-brown px-2 py-1 rounded-full text-sm"
                >
                  {genre}
                  <button
                    type="button"
                    onClick={() => removeGenre(genre)}
                    className="text-bookconnect-brown/70 hover:text-bookconnect-brown"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a genre..."
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addGenre}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Favorite Authors */}
          <div className="space-y-2">
            <Label>Favorite Authors</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {favoriteAuthors.map((author, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-bookconnect-cream text-bookconnect-brown px-2 py-1 rounded-full text-sm"
                >
                  {author}
                  <button
                    type="button"
                    onClick={() => removeAuthor(author)}
                    className="text-bookconnect-brown/70 hover:text-bookconnect-brown"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add an author..."
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAuthor}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <SyncProfilesButton />
          </div>
          <Button
            type="submit"
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default BookClubProfileSettings;
