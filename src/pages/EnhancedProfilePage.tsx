import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Book, Clock, ArrowLeft, BookOpen, Crown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getUserClubMemberships } from '@/lib/api/profile';
import ProfileForm from '@/components/profile/ProfileForm/ProfileForm';



// Import our new components
import ProfileHeader from '@/components/profile/enhanced/ProfileHeader';
import ProfilePreferences from '@/components/profile/enhanced/ProfilePreferences';
import ProfileAvailability from '@/components/profile/enhanced/ProfileAvailability';
import ProfileSubscriptionDisplay from '@/components/profile/enhanced/ProfileSubscriptionDisplay';
import { UserMetadata, ClubMembership } from '@/components/profile/enhanced/types';
import { getUserProfile, clearProfileCache } from '@/services/profileService';

const EnhancedProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [userMetadata, setUserMetadata] = useState<UserMetadata>({});
  // We'll keep memberships state for future use
  const [memberships, setMemberships] = useState<ClubMembership[]>([]);


  // Fetch user data and memberships
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);

        // Get profile data from database (includes avatar URLs)
        const userProfile = await getUserProfile(user.id);

        // Combine database profile data with auth metadata from useAuth hook
        const combinedMetadata: UserMetadata = {
          // Database fields (primary source for avatar URLs)
          display_name: userProfile.displayname,
          username: userProfile.username,
          avatar_url: userProfile.avatar_url,
          avatar_thumbnail_url: userProfile.avatar_thumbnail_url,
          avatar_medium_url: userProfile.avatar_medium_url,
          avatar_full_url: userProfile.avatar_full_url,
          bio: userProfile.bio,
          // Auth metadata fields (fallback for preferences)
          reading_frequency: user?.user_metadata?.reading_frequency,
          favorite_genres: user?.user_metadata?.favorite_genres || [],
          favorite_authors: user?.user_metadata?.favorite_authors || [],
          preferred_meeting_times: user?.user_metadata?.preferred_meeting_times || []
        };

        setUserMetadata(combinedMetadata);

        // Fetch club memberships
        try {
          const membershipsData = await getUserClubMemberships(user.id);
          setMemberships(membershipsData);
        } catch (membershipError) {
          console.error('Error fetching memberships:', membershipError);
          setMemberships([]);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, navigate]);

  // Handle profile update
  const handleProfileUpdated = async () => {
    try {
      // Clear profile cache to ensure fresh data
      clearProfileCache();

      // Get fresh profile data from database
      const userProfile = await getUserProfile(user.id);

      // Combine database profile data with auth metadata from useAuth hook
      const combinedMetadata: UserMetadata = {
        // Database fields (primary source for avatar URLs)
        display_name: userProfile.displayname,
        username: userProfile.username,
        avatar_url: userProfile.avatar_url,
        avatar_thumbnail_url: userProfile.avatar_thumbnail_url,
        avatar_medium_url: userProfile.avatar_medium_url,
        avatar_full_url: userProfile.avatar_full_url,
        bio: userProfile.bio,
        // Auth metadata fields (fallback for preferences)
        reading_frequency: user?.user_metadata?.reading_frequency,
        favorite_genres: user?.user_metadata?.favorite_genres || [],
        favorite_authors: user?.user_metadata?.favorite_authors || [],
        preferred_meeting_times: user?.user_metadata?.preferred_meeting_times || []
      };

      setUserMetadata(combinedMetadata);

      // Exit edit mode
      setEditMode(false);
    } catch (error) {
      console.error('Error refreshing user data:', error);
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
            <Button
              variant="ghost"
              onClick={() => navigate('/book-club')}
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Book Clubs
            </Button>
            <div className="animate-pulse space-y-6">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If in edit mode, show the profile form
  if (editMode) {
    return (
      <div className="min-h-screen bg-bookconnect-cream">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => navigate('/book-club')}
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Book Clubs
            </Button>
            <ProfileForm
              onCancel={() => setEditMode(false)}
              onProfileUpdated={handleProfileUpdated}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bookconnect-cream">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/book-club')}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Book Clubs
          </Button>
          {/* Profile Header */}
          <ProfileHeader
            user={user}
            userMetadata={userMetadata}
            onEditProfile={() => setEditMode(true)}
          />

          {/* Profile Content */}
          <Tabs defaultValue="preferences" className="mt-6">
            <div className="flex justify-end mb-4">
              <TabsList className="bg-bookconnect-cream border border-bookconnect-brown/20">
                <TabsTrigger
                  value="preferences"
                  className="flex items-center gap-2 data-[state=active]:bg-bookconnect-brown data-[state=active]:text-white"
                >
                  <Book className="h-4 w-4" />
                  Reading Preferences
                </TabsTrigger>

                <TabsTrigger
                  value="availability"
                  className="flex items-center gap-2 data-[state=active]:bg-bookconnect-brown data-[state=active]:text-white"
                >
                  <Clock className="h-4 w-4" />
                  Availability
                </TabsTrigger>

                <TabsTrigger
                  value="subscription"
                  className="flex items-center gap-2 data-[state=active]:bg-bookconnect-brown data-[state=active]:text-white"
                >
                  <Crown className="h-4 w-4" />
                  Subscription & Membership
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Reading Preferences Tab */}
            <TabsContent value="preferences">
              <ProfilePreferences userMetadata={userMetadata} />
            </TabsContent>



            {/* Availability Tab */}
            <TabsContent value="availability">
              <ProfileAvailability userMetadata={userMetadata} />
            </TabsContent>

            {/* Subscription & Membership Tab */}
            <TabsContent value="subscription">
              <ProfileSubscriptionDisplay />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProfilePage;
