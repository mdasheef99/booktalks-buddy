import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import BookClubProfileHeader from '@/components/profile/BookClubProfileHeader';
import BookClubMemberships from '@/components/profile/BookClubMemberships';
import ProfileReadingListSection from '@/components/profile/ProfileReadingListSection';
import ProfileCollectionsSection from '@/components/profile/ProfileCollectionsSection';
import { BookClubProfile, ClubMembership, getBookClubProfile, getUserClubMemberships } from '@/lib/api/profile';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, BookOpen, FolderOpen } from 'lucide-react';


import { BackButton } from '@/components/ui/BackButton';

const BookClubProfilePage: React.FC = () => {
  const { username, userId } = useParams<{ username?: string; userId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<BookClubProfile | null>(null);
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine if this is the current user's profile for viewing permissions only
  const isCurrentUser = useMemo(() => {
    if (!user) return false;

    // If viewing by username, compare usernames
    if (username) {
      return user.user_metadata?.username === username ||
             user.email?.split('@')[0] === username;
    }

    // If viewing by userId, compare user IDs
    if (userId) {
      return user.id === userId;
    }

    // If no params, it's the current user's profile
    return true;
  }, [user, username, userId]);

  // Validate URL parameters with proper format checking
  const validateProfileParams = (username?: string, userId?: string) => {
    // Username validation: 3-20 characters, alphanumeric + underscore only
    if (username && (
      username.length < 3 ||
      username.length > 20 ||
      !/^[a-zA-Z0-9_]+$/.test(username)
    )) {
      throw new Error('Invalid username format');
    }

    // UserId validation: Can be either UUID format OR username format
    // (The system uses usernames in /profile/:userId routes)
    if (userId) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
      const isUsername = userId.length >= 3 && userId.length <= 20 && /^[a-zA-Z0-9_]+$/.test(userId);

      if (!isUUID && !isUsername) {
        throw new Error('Invalid user identifier format');
      }
    }
  };

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        // Validate URL parameters
        validateProfileParams(username, userId);
      } catch (error) {
        console.error('Profile URL validation failed:', error);
        toast.error('Invalid profile URL');
        navigate('/book-club');
        return;
      }

      try {
        setLoading(true);

        // Determine the actual user ID for membership queries
        let actualUserId: string;
        let profileData: any = null;

        // If viewing current user's profile, try to get from database first
        if (isCurrentUser) {
          actualUserId = user.id;

          try {
            // First, try to get the user profile from the users table
            const { data: userRecord, error: userError } = await supabase
              .from('users')
              .select('id, email, username, avatar_url, bio, favorite_genres, favorite_authors, created_at')
              .eq('id', user.id)
              .single();

            if (!userError && userRecord) {
              profileData = userRecord;
            } else {
              // Fallback to auth data if no database record
              const { data: authUser, error: authError } = await supabase.auth.getUser();

              if (authError) {
                console.error('Error getting auth user:', authError);
                throw authError;
              }

              // Create a profile object from current user's auth data
              profileData = {
                id: user.id,
                email: authUser.user?.email || 'unknown@example.com',
                username: authUser.user?.email?.split('@')[0] || 'User',
                avatar_url: null,
                bio: null,
                favorite_genres: [],
                favorite_authors: [],
                created_at: authUser.user?.created_at || new Date().toISOString()
              };
            }
          } catch (error) {
            console.error('Error loading current user profile:', error);
            // Continue with fallback approach
          }
        }
        // If viewing another user's profile, fetch from database
        else {
          let userData = null;

          // First try by userId if provided (could be UUID or username)
          if (userId) {
            // Check if userId looks like a UUID
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

            if (isUUID) {
              // Query by ID
              const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

              if (!error && data) {
                userData = data;
              }
            } else {
              // Query by username
              const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', userId)
                .single();

              if (!error && data) {
                userData = data;
              }
            }
          }

          // If not found by userId and username is provided, try by username
          if (!userData && username) {
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('username', username)
              .single();

            if (!error && data) {
              userData = data;
            }
          }

          // If user found in database, use that data
          if (userData) {
            actualUserId = userData.id; // Store the actual UUID
            profileData = {
              id: userData.id,
              email: '', // Don't expose email for privacy
              username: userData.username || `User-${userData.id.substring(0, 4)}`,
              avatar_url: userData.avatar_url || null,
              bio: userData.bio || null,
              favorite_genres: userData.favorite_genres || [],
              favorite_authors: userData.favorite_authors || [],
              created_at: userData.created_at || new Date().toISOString()
            };
          }
          // If user not found, create a placeholder profile
          else {
            console.warn('User not found in database, creating placeholder');
            // Use a fallback UUID for membership queries (will return empty results)
            actualUserId = '00000000-0000-0000-0000-000000000000';
            profileData = {
              id: actualUserId,
              email: '',
              username: username || userId || 'Unknown User',
              avatar_url: null,
              bio: null,
              favorite_genres: [],
              favorite_authors: [],
              created_at: new Date().toISOString()
            };
          }
        }

        // Set the profile data
        if (profileData) {
          setProfile(profileData);
        }

        // For memberships, fetch those using the actual UUID
        try {
          const membershipsData = await getUserClubMemberships(actualUserId);
          setMemberships(membershipsData);
        } catch (membershipError) {
          console.error('Error fetching memberships:', membershipError);
          // Continue with empty memberships
          setMemberships([]);
        }

        return;
      } catch (error) {
        console.error('Error fetching profile data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user, username, navigate]);

  // Handle profile refresh
  const handleProfileUpdated = async () => {
    if (!user) return;

    try {
      // Refresh profile data after updates
      // This function is kept for potential future use but no longer handles edit mode
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error refreshing profile data:', error);
      toast.error('Failed to refresh profile data');
    }
  };

  if (!user) {
    return null; // Will redirect to login in useEffect
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bookconnect-cream">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <div className="mb-4">
              <BackButton
                fallbackRoute="/book-clubs"
                variant="outline"
                size="sm"
                label="Back"
                showTooltip={true}
              />
            </div>

            <div className="animate-pulse space-y-6">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-bookconnect-cream">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <div className="mb-4">
              <BackButton
                fallbackRoute="/book-clubs"
                variant="outline"
                size="sm"
                label="Back"
                showTooltip={true}
              />
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
              <p className="mb-6">The profile you're looking for doesn't exist or you don't have permission to view it.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bookconnect-cream">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-4">
            <BackButton
              fallbackRoute="/book-clubs"
              variant="outline"
              size="sm"
              label="Back"
              showTooltip={true}
            />
          </div>

          {/* Profile Header */}
          <BookClubProfileHeader
            profile={profile}
            isCurrentUser={isCurrentUser}
            onProfileUpdated={handleProfileUpdated}
          />

          {/* Profile Content - View Only */}
          <Tabs defaultValue="clubs" className="mt-6">
            <TabsList className="mb-4">
              <TabsTrigger value="clubs" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Book Clubs
              </TabsTrigger>
              <TabsTrigger value="reading" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Reading List
              </TabsTrigger>
              <TabsTrigger value="collections" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Collections
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clubs">
              <BookClubMemberships
                memberships={memberships}
                loading={loading}
                isCurrentUser={isCurrentUser}
              />
            </TabsContent>

            <TabsContent value="reading">
              <ProfileReadingListSection
                userId={profile.id}
                username={profile.username}
                isCurrentUser={isCurrentUser}
              />
            </TabsContent>

            <TabsContent value="collections">
              <ProfileCollectionsSection
                userId={profile.id}
                username={profile.username}
                isCurrentUser={isCurrentUser}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default BookClubProfilePage;
