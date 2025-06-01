import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import BookClubProfileHeader from '@/components/profile/BookClubProfileHeader';
import BookClubMemberships from '@/components/profile/BookClubMemberships';
import BookClubProfileSettings from '@/components/profile/BookClubProfileSettings';
import { BookClubProfile, ClubMembership, getBookClubProfile, getUserClubMemberships } from '@/lib/api/profile';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, BookOpen } from 'lucide-react';

const BookClubProfilePage: React.FC = () => {
  const { username, userId } = useParams<{ username?: string; userId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<BookClubProfile | null>(null);
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // Determine if this is the current user's profile with proper logic
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
      // Since we're using a simplified profile approach, we'll just exit edit mode
      // In a real implementation, we would fetch the updated profile data here

      // Exit edit mode
      setEditMode(false);
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
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
            <p className="mb-6">The profile you're looking for doesn't exist or you don't have permission to view it.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bookconnect-cream">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <BookClubProfileHeader
            profile={profile}
            isCurrentUser={isCurrentUser}
            onEditProfile={() => setEditMode(true)}
            onProfileUpdated={handleProfileUpdated}
          />

          {/* Profile Content */}
          {editMode ? (
            <BookClubProfileSettings
              profile={profile}
              onCancel={() => setEditMode(false)}
              onProfileUpdated={handleProfileUpdated}
            />
          ) : (
            <Tabs defaultValue="clubs" className="mt-6">
              <TabsList className="mb-4">
                <TabsTrigger value="clubs" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Book Clubs
                </TabsTrigger>
                <TabsTrigger value="books" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Reading
                </TabsTrigger>
              </TabsList>

              <TabsContent value="clubs">
                <BookClubMemberships
                  memberships={memberships}
                  loading={loading}
                  isCurrentUser={isCurrentUser}
                />
              </TabsContent>

              <TabsContent value="books">
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <h3 className="text-lg font-medium mb-2">Reading History</h3>
                  <p className="text-gray-500">
                    Your reading history will appear here as you participate in book clubs.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookClubProfilePage;
