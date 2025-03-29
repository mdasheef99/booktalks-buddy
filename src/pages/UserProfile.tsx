
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Book, Mail, MessageCircle } from "lucide-react";
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
        toast({
          title: "Please log in",
          description: "You need to be logged in to start a chat",
          variant: "destructive"
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
          toast({
            title: "Chat request pending",
            description: "You've already sent or received a request from this user",
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
        
      toast({
        title: "Chat request sent!",
        description: `${userData.username} will be notified of your request`,
      });
    } catch (err) {
      console.error("Error starting chat:", err);
      Sentry.captureException(err);
      toast({
        title: "Error",
        description: "Unable to start chat. Please try again later.",
        variant: "destructive"
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
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
          <>
            <Card className="border border-bookconnect-brown/20 shadow-md bg-bookconnect-cream/90">
              <CardHeader className="pb-4">
                <CardTitle className="font-serif text-3xl text-bookconnect-brown flex items-center">
                  {userData.username}
                </CardTitle>
                <CardDescription>
                  {userData.bio || "This user hasn't added a bio yet."}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-bookconnect-brown/60 mb-1">Favorite genre</h3>
                    <p className="text-bookconnect-brown">{userData.favorite_genre || "Not specified"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-bookconnect-brown/60 mb-1">Favorite author</h3>
                    <p className="text-bookconnect-brown">{userData.favorite_author || "Not specified"}</p>
                  </div>
                  
                  <Separator className="my-4 bg-bookconnect-brown/20" />
                  
                  <div className="flex justify-center gap-3 pt-2">
                    {userData.allow_chats !== false && (
                      <Button 
                        variant="outline" 
                        onClick={handleStartChat}
                        className="border border-bookconnect-brown text-bookconnect-brown hover:bg-bookconnect-terracotta hover:text-white"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Start Chat
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/books')}
                      className="border border-bookconnect-brown text-bookconnect-brown hover:bg-bookconnect-sage hover:text-white"
                    >
                      <Book className="h-4 w-4 mr-2" />
                      View Reading List
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default UserProfile;
