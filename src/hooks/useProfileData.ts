
import { useState, useEffect } from "react";
import * as Sentry from "@sentry/react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchChatRequests, 
  fetchActiveChatsCount, 
  handleChatAction, 
  saveProfile, 
  loadProfileData 
} from "@/components/profile/profileService";
import { ChatRequest } from "@/components/profile/ChatRequestsList";

export function useProfileData() {
  const { toast } = useToast();
  // Use anon_username as primary source, fall back to username
  const [username, setUsername] = useState<string>(() =>
    localStorage.getItem("anon_username") || localStorage.getItem("username") || ""
  );
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [favoriteAuthor, setFavoriteAuthor] = useState("");
  const [favoriteGenre, setFavoriteGenre] = useState<string>(() => {
    try {
      const savedGenres = localStorage.getItem("selected_genres");
      if (savedGenres) {
        const parsed = JSON.parse(savedGenres);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : "Fiction";
      }
      return "Fiction";
    } catch (e) {
      return "Fiction";
    }
  });
  const [bio, setBio] = useState("");
  const [allowChats, setAllowChats] = useState(true);
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const [activeChatsCount, setActiveChatsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const initialize = async () => {
    try {
      const profileData = await loadProfileData();
      if (profileData) {
        if (profileData.username) setUsername(profileData.username);
        if (profileData.displayName !== undefined) setDisplayName(profileData.displayName);
        if (profileData.favoriteAuthor) setFavoriteAuthor(profileData.favoriteAuthor);
        if (profileData.favoriteGenre) setFavoriteGenre(profileData.favoriteGenre);
        if (profileData.bio) setBio(profileData.bio);
        if (profileData.allowChats !== null) setAllowChats(profileData.allowChats);

        if (profileData.username) {
          localStorage.setItem("username", profileData.username);
          localStorage.setItem("anon_username", profileData.username);
        }
      }
      
      const requests = await fetchChatRequests();
      setChatRequests(requests);
      
      const chatsCount = await fetchActiveChatsCount();
      setActiveChatsCount(chatsCount);
    } catch (err) {
      console.error("Error loading profile data:", err);
      Sentry.captureException(err, {
        tags: { component: "ProfileDialog", action: "initializeProfile" }
      });
    }
  };

  const setupRealtimeSubscription = () => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;
    
    const channel = supabase
      .channel('private_chats_changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'private_chats',
          filter: `receiver_id=eq.${userId}` 
        }, 
        async () => {
          const requests = await fetchChatRequests();
          setChatRequests(requests);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);

    try {
      const success = await saveProfile(
        username, // Username is read-only, but still passed for identification
        favoriteAuthor,
        favoriteGenre,
        bio,
        allowChats
      );
      
      if (success) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        });
      } else {
        toast({
          title: "Profile save failed!",
          description: "We couldn't save your profile changes.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      Sentry.captureException(err, {
        tags: { component: "ProfileDialog", action: "handleSaveProfile" }
      });
      
      toast({
        title: "Profile save failed!",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatActionRequest = async (chatId: string, action: 'accept' | 'reject') => {
    try {
      const success = await handleChatAction(chatId, action);
      
      if (success) {
        setChatRequests(prev => prev.filter(req => req.id !== chatId));
        
        if (action === 'accept') {
          setActiveChatsCount(prev => prev + 1);
          toast({
            title: "Chat request accepted!",
            description: "You can now start chatting with this user."
          });
        } else {
          toast({
            title: "Chat request rejected",
            description: "The request has been declined."
          });
        }
      } else {
        toast({
          title: `Couldn't ${action} chat request`,
          description: "Please try again later.",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error(`Error ${action}ing chat request:`, err);
      Sentry.captureException(err, {
        tags: { component: "ProfileDialog", action: `handleChatAction_${action}` },
        extra: { chatId }
      });
    }
  };
  
  // Handler for display name updates
  const handleDisplayNameUpdate = (newDisplayName: string | null) => {
    setDisplayName(newDisplayName);
  };

  return {
    // State
    username, // Read-only
    displayName,
    favoriteAuthor,
    setFavoriteAuthor,
    favoriteGenre,
    setFavoriteGenre,
    bio,
    setBio,
    allowChats,
    setAllowChats,
    chatRequests,
    activeChatsCount,
    isLoading,

    // Methods
    initialize,
    setupRealtimeSubscription,
    handleSaveProfile,
    handleChatActionRequest,
    handleDisplayNameUpdate
  };
}
