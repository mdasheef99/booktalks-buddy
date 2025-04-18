import React, { useState, useEffect } from 'react';
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

  // Determine if this is the current user's profile
  const isCurrentUser = (!username && !userId) || (user && profile && user.id === profile.id);

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);

        // If no username or userId is provided, show the current user's profile
        // If userId is provided in the URL, use that, otherwise use the current user's ID
        const profileUserId = userId || username || user.id;
        console.log('Fetching profile for user ID:', profileUserId);

        // First, let's check what tables are available
        console.log('Checking database structure...');

        // Try to get the user profile from auth.users instead
        const { data: authUser, error: authError } = await supabase.auth.getUser();

        if (authError) {
          console.error('Error getting auth user:', authError);
          throw authError;
        }

        console.log('Auth user data:', authUser);

        // Create a simplified profile object from auth data
        const simplifiedProfile = {
          id: profileUserId,
          email: authUser.user?.email || 'unknown@example.com',
          username: authUser.user?.email?.split('@')[0] || 'User',
          avatar_url: null,
          bio: null,
          favorite_genres: [],
          favorite_authors: [],
          created_at: authUser.user?.created_at || new Date().toISOString()
        };

        // Use this simplified profile instead of trying to fetch from the database
        setProfile(simplifiedProfile);

        // For memberships, we can still try to fetch those
        try {
          const membershipsData = await getUserClubMemberships(profileUserId);
          console.log('Memberships data:', membershipsData);
          setMemberships(membershipsData);
        } catch (membershipError) {
          console.error('Error fetching memberships:', membershipError);
          // Continue with empty memberships
          setMemberships([]);
        }

        // Skip the rest of the profile fetching logic
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
