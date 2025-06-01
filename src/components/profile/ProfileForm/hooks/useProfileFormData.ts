/**
 * Custom hook for managing ProfileForm data loading and state
 * Handles loading user profile data from database and user_metadata
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ProfileFormData {
  username: string;
  displayName: string;
  bio: string;
  favoriteAuthor: string;
  favoriteAuthors: string[];
  favoriteGenre: string;
  favoriteGenres: string[];
  readingFrequency: string;
  preferredMeetingTimes: string[];
  // Avatar URLs for multi-tier system
  avatarUrl: string;
  avatarThumbnailUrl: string;
  avatarMediumUrl: string;
  avatarFullUrl: string;
}

export interface UseProfileFormDataReturn {
  // Data state
  formData: ProfileFormData;
  
  // Loading state
  isLoading: boolean;
  
  // Update functions
  updateUsername: (value: string) => void;
  updateDisplayName: (value: string) => void;
  updateBio: (value: string) => void;
  updateFavoriteAuthor: (value: string) => void;
  updateFavoriteAuthors: (value: string[]) => void;
  updateFavoriteGenre: (value: string) => void;
  updateFavoriteGenres: (value: string[]) => void;
  updateReadingFrequency: (value: string) => void;
  updatePreferredMeetingTimes: (value: string[]) => void;
  updateAvatarUrls: (urls: { avatarUrl: string; avatarThumbnailUrl: string; avatarMediumUrl: string; avatarFullUrl: string; }) => void;
  
  // Helper functions
  addFavoriteAuthor: (author: string) => void;
  removeFavoriteAuthor: (author: string) => void;
  addFavoriteGenre: (genre: string) => void;
  removeFavoriteGenre: (genre: string) => void;
  toggleMeetingTime: (time: string) => void;
  
  // Save function
  saveProfile: () => Promise<boolean>;
}

export function useProfileFormData(): UseProfileFormDataReturn {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    displayName: '',
    bio: '',
    favoriteAuthor: '',
    favoriteAuthors: [],
    favoriteGenre: '',
    favoriteGenres: [],
    readingFrequency: '',
    preferredMeetingTimes: [],
    avatarUrl: '',
    avatarThumbnailUrl: '',
    avatarMediumUrl: '',
    avatarFullUrl: ''
  });

  // Load existing profile data
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        
        // First, try to load from the users table (primary source)
        const { data: userRecord, error: userError } = await supabase
          .from('users')
          .select('username, displayname, bio, favorite_author, favorite_genre, avatar_url, avatar_thumbnail_url, avatar_medium_url, avatar_full_url')
          .eq('id', user.id)
          .single();

        if (!userError && userRecord) {
          // Load from database
          setFormData(prev => ({
            ...prev,
            username: userRecord.username || '',
            displayName: userRecord.displayname || '',
            bio: userRecord.bio || '',
            favoriteAuthor: userRecord.favorite_author || '',
            favoriteGenre: userRecord.favorite_genre || '',
            avatarUrl: userRecord.avatar_url || '',
            avatarThumbnailUrl: userRecord.avatar_thumbnail_url || '',
            avatarMediumUrl: userRecord.avatar_medium_url || '',
            avatarFullUrl: userRecord.avatar_full_url || ''
          }));
        } else {
          console.log('No user record found, trying user_metadata...');
        }

        // Also load from user_metadata as fallback/additional data
        const { data: { user: userData } } = await supabase.auth.getUser();
        if (userData?.user_metadata) {
          const metadata = userData.user_metadata;

          setFormData(prev => ({
            ...prev,
            // Only use metadata username if database didn't provide it
            username: prev.username || metadata.username || '',
            favoriteAuthors: metadata.favorite_authors || [],
            favoriteAuthor: prev.favoriteAuthor || metadata.favorite_author || '',
            favoriteGenres: metadata.favorite_genres || [],
            favoriteGenre: prev.favoriteGenre || metadata.favorite_genre || '',
            readingFrequency: metadata.reading_frequency || '',
            preferredMeetingTimes: metadata.preferred_meeting_times || []
          }));

          // Add favorite author to list if not already included
          if (metadata.favorite_author && !metadata.favorite_authors?.includes(metadata.favorite_author)) {
            setFormData(prev => ({
              ...prev,
              favoriteAuthors: [...prev.favoriteAuthors, metadata.favorite_author]
            }));
          }

          // Add favorite genre to list if not already included
          if (metadata.favorite_genre && !metadata.favorite_genres?.includes(metadata.favorite_genre)) {
            setFormData(prev => ({
              ...prev,
              favoriteGenres: [...prev.favoriteGenres, metadata.favorite_genre]
            }));
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // Update functions
  const updateUsername = (value: string) => {
    setFormData(prev => ({ ...prev, username: value }));
  };

  const updateDisplayName = (value: string) => {
    setFormData(prev => ({ ...prev, displayName: value }));
  };

  const updateBio = (value: string) => {
    setFormData(prev => ({ ...prev, bio: value }));
  };

  const updateFavoriteAuthor = (value: string) => {
    setFormData(prev => ({ ...prev, favoriteAuthor: value }));
  };

  const updateFavoriteAuthors = (value: string[]) => {
    setFormData(prev => ({ ...prev, favoriteAuthors: value }));
  };

  const updateFavoriteGenre = (value: string) => {
    setFormData(prev => ({ ...prev, favoriteGenre: value }));
  };

  const updateFavoriteGenres = (value: string[]) => {
    setFormData(prev => ({ ...prev, favoriteGenres: value }));
  };

  const updateReadingFrequency = (value: string) => {
    setFormData(prev => ({ ...prev, readingFrequency: value }));
  };

  const updatePreferredMeetingTimes = (value: string[]) => {
    setFormData(prev => ({ ...prev, preferredMeetingTimes: value }));
  };

  const updateAvatarUrls = (urls: { avatarUrl: string; avatarThumbnailUrl: string; avatarMediumUrl: string; avatarFullUrl: string; }) => {
    setFormData(prev => ({
      ...prev,
      avatarUrl: urls.avatarUrl,
      avatarThumbnailUrl: urls.avatarThumbnailUrl,
      avatarMediumUrl: urls.avatarMediumUrl,
      avatarFullUrl: urls.avatarFullUrl
    }));
  };

  // Helper functions
  const addFavoriteAuthor = (author: string) => {
    if (author && !formData.favoriteAuthors.includes(author)) {
      setFormData(prev => ({
        ...prev,
        favoriteAuthors: [...prev.favoriteAuthors, author],
        favoriteAuthor: ''
      }));
    }
  };

  const removeFavoriteAuthor = (author: string) => {
    setFormData(prev => ({
      ...prev,
      favoriteAuthors: prev.favoriteAuthors.filter(a => a !== author)
    }));
  };

  const addFavoriteGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      favoriteGenre: genre,
      favoriteGenres: prev.favoriteGenres.includes(genre) 
        ? prev.favoriteGenres 
        : [...prev.favoriteGenres, genre]
    }));
  };

  const removeFavoriteGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      favoriteGenres: prev.favoriteGenres.filter(g => g !== genre),
      favoriteGenre: prev.favoriteGenre === genre ? '' : prev.favoriteGenre
    }));
  };

  const toggleMeetingTime = (time: string) => {
    setFormData(prev => ({
      ...prev,
      preferredMeetingTimes: prev.preferredMeetingTimes.includes(time)
        ? prev.preferredMeetingTimes.filter(t => t !== time)
        : [...prev.preferredMeetingTimes, time]
    }));
  };

  // Save profile function
  const saveProfile = async (): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to update your profile');
      return false;
    }

    try {
      // Update user metadata (username is read-only, not included in updates)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          display_name: formData.displayName,
          bio: formData.bio,
          favorite_author: formData.favoriteAuthor,
          favorite_authors: formData.favoriteAuthors,
          favorite_genre: formData.favoriteGenre,
          favorite_genres: formData.favoriteGenres,
          reading_frequency: formData.readingFrequency,
          preferred_meeting_times: formData.preferredMeetingTimes
        }
      });

      if (authError) throw authError;

      // Update users table with profile data including avatar URLs
      const { error: dbError } = await supabase
        .from('users')
        .update({
          displayname: formData.displayName,
          bio: formData.bio,
          favorite_author: formData.favoriteAuthor,
          favorite_genre: formData.favoriteGenre,
          avatar_url: formData.avatarUrl,
          avatar_thumbnail_url: formData.avatarThumbnailUrl,
          avatar_medium_url: formData.avatarMediumUrl,
          avatar_full_url: formData.avatarFullUrl
        })
        .eq('id', user.id);

      if (dbError) throw dbError;

      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      return false;
    }
  };

  return {
    // Data state
    formData,
    
    // Loading state
    isLoading,
    
    // Update functions
    updateUsername,
    updateDisplayName,
    updateBio,
    updateFavoriteAuthor,
    updateFavoriteAuthors,
    updateFavoriteGenre,
    updateFavoriteGenres,
    updateReadingFrequency,
    updatePreferredMeetingTimes,
    updateAvatarUrls,
    
    // Helper functions
    addFavoriteAuthor,
    removeFavoriteAuthor,
    addFavoriteGenre,
    removeFavoriteGenre,
    toggleMeetingTime,
    
    // Save function
    saveProfile
  };
}
