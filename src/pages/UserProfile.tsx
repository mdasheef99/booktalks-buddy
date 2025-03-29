
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Book, MessageCircle, User, BookOpen, Award } from "lucide-react";
import * as Sentry from "@sentry/react";
import { toast } from "sonner";

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<{
    username: string;
    favorite_author?: string;
    favorite_genre?: string;
    bio?: string;
    id?: string;
    allow_chats?: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCurrentUser, setIsCurrentUser] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!username) return;

        const { data, error } = await supabase
          .from('users')
          .select('username, favorite_author, favorite_genre, bio, id, allow_chats')
          .eq('username', username)
          .single();

        if (error) {
          console.error("Error fetching user data:", error);
          Sentry.captureException(error, {
            tags: { component: "UserProfile" },
            extra: { username }
          });
          return;
        }

        setUserData(data);
        
        // Check if this is the current user's profile
        const currentUsername = localStorage.getItem("username") || localStorage.getItem("anon_username");
        setIsCurrentUser(currentUsername === data.username);
      } catch (err) {
        console.error("Error in user profile:", err);
        Sentry.captureException(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  const handleStartChat = async () => {
    if (!userData?.id) return;

    try {
      const myUserId = localStorage.getItem("user_id");
      
      if (!myUserId) {
        toast("Please log in", {
          description: "You need to be logged in to start a chat"
        });
        return;
      }
      
      // Check if there's already a chat
      const { data: existingChat } = await supabase
        .from('private_chats')
        .select('id, status')
        .or(`and(requester_id.eq.${myUserId},receiver_id.eq.${userData.id}),and(requester_id.eq.${userData.id},receiver_id.eq.${myUserId})`)
        .maybeSingle();
      
      if (existingChat) {
        if (existingChat.status === 'accepted') {
          navigate('/chat-selection');
          return;
        } else if (existingChat.status === 'pending') {
          toast("Chat request pending", {
            description: "You've already sent or received a request from this user"
          });
          return;
        }
      }
      
      // Create new chat request
      await supabase
        .from('private_chats')
        .insert({
          requester_id: myUserId,
          receiver_id: userData.id,
          status: 'pending'
        });
        
      toast("Chat request sent!", {
        description: `${userData.username} will be notified of your request`
      });
    } catch (err) {
      console.error("Error starting chat:", err);
      Sentry.captureException(err);
      toast("Error", {
        description: "Unable to start chat. Please try again later."
      });
    }
  };

  const handleEditProfile = () => {
    // Open the profile dialog
    // Here we're just navigating to the profile page since that's where the dialog is
    navigate('/profile');
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="flex items-center mb-6 text-bookconnect-brown hover:text-bookconnect-terracotta"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Back</span>
        </Button>
        
        {isLoading ? (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-t-2 border-b-2 border-bookconnect-brown rounded-full animate-spin mx-auto"></div>
            <p className="mt-2 text-bookconnect-brown">Loading profile...</p>
          </div>
        ) : !userData ? (
          <Card className="border border-bookconnect-brown/20 shadow-md bg-bookconnect-cream/90">
            <CardContent className="pt-6 pb-8 text-center">
              <h1 className="text-2xl font-serif text-bookconnect-brown mb-4">User not found</h1>
              <p className="text-bookconnect-brown/70">The user "{username}" doesn't exist or has deleted their account.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Profile Card */}
            <Card className="border border-bookconnect-brown/20 shadow-md bg-bookconnect-cream/90 md:col-span-2">
              <div className="relative h-32 bg-gradient-to-r from-bookconnect-sage/40 to-bookconnect-terracotta/40 rounded-t-lg overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2028&auto=format&fit=crop')] opacity-30 bg-cover bg-center"></div>
              </div>
              
              <div className="relative px-6">
                <div className="flex items-end -mt-12 mb-4">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-bookconnect-brown to-bookconnect-terracotta flex items-center justify-center text-white text-3xl font-serif border-4 border-bookconnect-cream shadow-lg">
                    {userData.username ? userData.username.charAt(0).toUpperCase() : "U"}
                  </div>
                </div>

                <CardHeader className="px-0 pb-2">
                  <CardTitle className="font-serif text-3xl text-bookconnect-brown flex items-center">
                    {userData.username}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs bg-bookconnect-sage/20 text-bookconnect-sage px-2 py-1 rounded-full font-sans">
                        This is you
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-bookconnect-brown/70 text-base italic">
                    {userData.bio || "This reader hasn't added a bio yet."}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="px-0 pb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                    <div className="space-y-4 bg-white/40 p-4 rounded-lg border border-bookconnect-brown/10">
                      <h3 className="text-lg font-medium font-serif text-bookconnect-brown flex items-center">
                        <BookOpen className="h-4 w-4 mr-2 text-bookconnect-terracotta" />
                        Reading Preferences
                      </h3>
                      <div>
                        <h4 className="text-sm font-medium text-bookconnect-brown/60 mb-1">Favorite genre</h4>
                        <p className="text-bookconnect-brown bg-bookconnect-cream/60 px-3 py-1.5 rounded-md inline-block">
                          {userData.favorite_genre || "Not specified"}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-bookconnect-brown/60 mb-1">Favorite author</h4>
                        <p className="text-bookconnect-brown bg-bookconnect-cream/60 px-3 py-1.5 rounded-md inline-block">
                          {userData.favorite_author || "Not specified"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4 bg-white/40 p-4 rounded-lg border border-bookconnect-brown/10">
                      <h3 className="text-lg font-medium font-serif text-bookconnect-brown flex items-center">
                        <Award className="h-4 w-4 mr-2 text-bookconnect-terracotta" />
                        Stats
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-bookconnect-cream/60 rounded-lg">
                          <span className="block text-2xl font-serif text-bookconnect-terracotta">12</span>
                          <span className="text-xs text-bookconnect-brown/70">Books Read</span>
                        </div>
                        <div className="text-center p-3 bg-bookconnect-cream/60 rounded-lg">
                          <span className="block text-2xl font-serif text-bookconnect-sage">5</span>
                          <span className="text-xs text-bookconnect-brown/70">Discussions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-6 bg-bookconnect-brown/20" />
                  
                  <div className="flex flex-wrap justify-center gap-3 pt-2">
                    {!isCurrentUser && userData.allow_chats !== false && (
                      <Button 
                        onClick={handleStartChat}
                        className="bg-bookconnect-terracotta hover:bg-bookconnect-terracotta/90 text-white shadow-md"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Start Chat
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/books')}
                      className="border border-bookconnect-brown text-bookconnect-brown bg-white/60 hover:bg-bookconnect-sage hover:text-white shadow-sm"
                    >
                      <Book className="h-4 w-4 mr-2" />
                      View Reading List
                    </Button>
                    
                    {isCurrentUser && (
                      <Button 
                        variant="outline"
                        onClick={handleEditProfile}
                        className="border border-bookconnect-brown text-bookconnect-brown bg-white/60 hover:bg-bookconnect-brown hover:text-white shadow-sm"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </CardContent>
              </div>
            </Card>
            
            {/* Recent Activity Card */}
            <Card className="border border-bookconnect-brown/20 shadow-md bg-bookconnect-cream/90">
              <CardHeader>
                <CardTitle className="font-serif text-xl text-bookconnect-brown">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 bg-white/50 rounded-lg border border-bookconnect-brown/10">
                      <p className="text-sm text-bookconnect-brown">
                        {i === 1 ? (
                          <>Started reading <span className="font-medium">The Great Gatsby</span></>
                        ) : i === 2 ? (
                          <>Commented on <span className="font-medium">Pride and Prejudice</span></>
                        ) : (
                          <>Added <span className="font-medium">1984</span> to reading list</>
                        )}
                      </p>
                      <p className="text-xs text-bookconnect-brown/60 mt-1">{i} day{i > 1 ? 's' : ''} ago</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserProfile;
