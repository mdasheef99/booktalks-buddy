import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import BookConnectHeader from '@/components/BookConnectHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Edit, Book, Clock, Calendar, PlusCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getUserClubMemberships } from '@/lib/api/profile';
import ProfileForm from '@/components/profile/ProfileForm';

// Reading frequency display mapping
const READING_FREQUENCY_LABELS = {
  'voracious': 'Voracious Reader',
  'regular': 'Regular Reader',
  'casual': 'Casual Reader',
  'occasional': 'Occasional Reader'
};

// Meeting time display mapping
const MEETING_TIME_LABELS = {
  'weekday_mornings': 'Weekday Mornings',
  'weekday_afternoons': 'Weekday Afternoons',
  'weekday_evenings': 'Weekday Evenings',
  'weekend_mornings': 'Weekend Mornings',
  'weekend_afternoons': 'Weekend Afternoons',
  'weekend_evenings': 'Weekend Evenings'
};

const EnhancedProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [userMetadata, setUserMetadata] = useState<any>(null);
  const [memberships, setMemberships] = useState<any[]>([]);

  // Fetch user data and memberships
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);

        // Get user data from Supabase Auth
        const { data: { user: userData }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;

        // Set user metadata
        setUserMetadata(userData?.user_metadata || {});

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
      // Refresh user data
      const { data: { user: userData }, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      // Update user metadata
      setUserMetadata(userData?.user_metadata || {});

      // Exit edit mode
      setEditMode(false);
    } catch (error) {
      console.error('Error refreshing user data:', error);
      toast.error('Failed to refresh profile data');
    }
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    if (!user?.email) return '?';

    const email = user.email;
    const namePart = email.split('@')[0];

    if (namePart.length <= 2) return namePart.toUpperCase();
    return namePart.substring(0, 2).toUpperCase();
  };

  if (!user) {
    return null; // Will redirect to login in useEffect
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bookconnect-cream">
        <BookConnectHeader />
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

  // If in edit mode, show the profile form
  if (editMode) {
    return (
      <div className="min-h-screen bg-bookconnect-cream">
        <BookConnectHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
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
      <BookConnectHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-6 overflow-hidden border-bookconnect-brown/20 shadow-md">
            <div className="h-32 bg-bookconnect-cream relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('/images/book-pattern.png')] opacity-20"></div>
            </div>
            <CardContent className="pt-0 relative">
              {/* Position buttons in top right corner, horizontally adjacent */}
              <div className="absolute top-0 right-0 flex flex-row gap-2 z-10 p-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-bookconnect-brown/30 text-bookconnect-brown hover:bg-bookconnect-cream bg-white"
                  onClick={() => setEditMode(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white"
                  onClick={() => navigate('/book-club/new')}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Book Club
                </Button>
              </div>

              {/* Profile layout with avatar in top left */}
              <div className="flex flex-col">
                {/* Avatar and name section */}
                <div className="flex items-start -mt-16 mb-6">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                    <AvatarImage src={userMetadata.avatar_url} alt="Profile" />
                    <AvatarFallback className="bg-bookconnect-terracotta/20 text-bookconnect-terracotta text-xl font-serif">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="ml-4 mt-4">
                    <h1 className="text-2xl font-bold font-serif text-bookconnect-brown">
                      {userMetadata.display_name || userMetadata.username || user.email?.split('@')[0] || 'BookClub Member'}
                    </h1>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-sm text-gray-600">Member since {new Date(user.created_at || Date.now()).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Bio section below profile info */}
                {userMetadata.bio && (
                  <div className="mt-2 max-w-full">
                    <div className="text-gray-700 font-serif break-words whitespace-pre-wrap">
                      {userMetadata.bio.length > 300 && !bioExpanded
                        ? `${userMetadata.bio.substring(0, 300)}...`
                        : userMetadata.bio}
                    </div>
                    {userMetadata.bio.length > 300 && (
                      <button
                        onClick={() => setBioExpanded(!bioExpanded)}
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

                {userMetadata.reading_frequency && (
                  <Badge variant="outline" className="mt-3 bg-bookconnect-cream text-bookconnect-brown border-bookconnect-brown/20 self-start">
                    {READING_FREQUENCY_LABELS[userMetadata.reading_frequency as keyof typeof READING_FREQUENCY_LABELS] || userMetadata.reading_frequency}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

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
              </TabsList>
            </div>

            {/* Reading Preferences Tab */}
            <TabsContent value="preferences">
              <Card className="border-bookconnect-brown/20 shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-serif text-bookconnect-brown">Reading Preferences</CardTitle>
                  <CardDescription>Your favorite genres, authors, and reading habits</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-6">
                    {/* Favorite Genres */}
                    <div>
                      <h3 className="text-lg font-medium mb-2 font-serif text-bookconnect-brown">Favorite Genres</h3>
                      {userMetadata.favorite_genres && userMetadata.favorite_genres.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {userMetadata.favorite_genres.map((genre: string, index: number) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-bookconnect-cream text-bookconnect-brown border border-bookconnect-brown/20"
                            >
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No favorite genres added yet</p>
                      )}
                    </div>

                    {/* Favorite Authors */}
                    <div>
                      <h3 className="text-lg font-medium mb-2 font-serif text-bookconnect-brown">Favorite Authors</h3>
                      {userMetadata.favorite_authors && userMetadata.favorite_authors.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {userMetadata.favorite_authors.map((author: string, index: number) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="border-bookconnect-brown/30 text-bookconnect-brown"
                            >
                              {author}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No favorite authors added yet</p>
                      )}
                    </div>

                    {/* Reading Frequency */}
                    <div>
                      <h3 className="text-lg font-medium mb-2 font-serif text-bookconnect-brown">Reading Frequency</h3>
                      {userMetadata.reading_frequency ? (
                        <p className="font-serif">
                          {READING_FREQUENCY_LABELS[userMetadata.reading_frequency as keyof typeof READING_FREQUENCY_LABELS] || userMetadata.reading_frequency}
                        </p>
                      ) : (
                        <p className="text-gray-500 italic">No reading frequency specified</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>



            {/* Availability Tab */}
            <TabsContent value="availability">
              <Card className="border-bookconnect-brown/20 shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-serif text-bookconnect-brown">Availability</CardTitle>
                  <CardDescription>Your preferred meeting times for book club discussions</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div>
                    {userMetadata.preferred_meeting_times && userMetadata.preferred_meeting_times.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userMetadata.preferred_meeting_times.map((time: string, index: number) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-bookconnect-cream/30 rounded-lg border border-bookconnect-brown/10">
                            <Calendar className="h-5 w-5 text-bookconnect-terracotta" />
                            <span className="font-serif text-bookconnect-brown">
                              {MEETING_TIME_LABELS[time as keyof typeof MEETING_TIME_LABELS] || time}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-bookconnect-cream/30 rounded-lg border border-dashed border-bookconnect-brown/20">
                        <Calendar className="h-12 w-12 mx-auto text-bookconnect-brown/30 mb-3" />
                        <p className="text-gray-600 font-serif">No preferred meeting times specified</p>
                        <p className="text-sm text-gray-500 mt-2">Edit your profile to add your availability</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProfilePage;
