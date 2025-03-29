
import React, { useState, useEffect } from "react";
import * as Sentry from "@sentry/react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

import ProfileDialogHeader from "./ProfileDialogHeader";
import ProfileDialogContent from "./ProfileDialogContent";
import ProfileDialogFooter from "./ProfileDialogFooter";
import { 
  fetchChatRequests, 
  fetchActiveChatsCount, 
  handleChatAction, 
  saveProfile, 
  loadProfileData 
} from "./profileService";
import { ChatRequest } from "./ChatRequestsList";

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

const ProfileDialog: React.FC<ProfileDialogProps> = ({ open, onClose }) => {
  const { toast } = useToast();
  const [username, setUsername] = useState<string>(() => localStorage.getItem("username") || "");
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
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  useEffect(() => {
    const initializeProfile = async () => {
      if (open) {
        try {
          const profileData = await loadProfileData();
          if (profileData) {
            if (profileData.username) setUsername(profileData.username);
            if (profileData.favoriteAuthor) setFavoriteAuthor(profileData.favoriteAuthor);
            if (profileData.favoriteGenre) setFavoriteGenre(profileData.favoriteGenre);
            if (profileData.bio) setBio(profileData.bio);
            if (profileData.allowChats !== null) setAllowChats(profileData.allowChats);
            
            if (profileData.username) localStorage.setItem("username", profileData.username);
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
      }
    };

    initializeProfile();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const channel = supabase
      .channel('private_chats_changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'private_chats',
          filter: `receiver_id=eq.${localStorage.getItem("user_id")}` 
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
  }, [open]);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    
    try {
      const success = await saveProfile(
        username,
        favoriteAuthor,
        favoriteGenre,
        bio,
        allowChats
      );
      
      if (success) {
        setShowSavedMessage(true);
        setTimeout(() => setShowSavedMessage(false), 3000);
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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] mx-auto bg-bookconnect-cream overflow-hidden" 
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1528459105426-b9548367069b?q=80&w=1412&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
          backgroundColor: 'rgba(246, 241, 229, 0.92)',
          border: '1px solid #B8A088',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.15)'
        }}
      >
        <ProfileDialogHeader />
        
        <ProfileDialogContent
          username={username}
          setUsername={setUsername}
          favoriteAuthor={favoriteAuthor}
          setFavoriteAuthor={setFavoriteAuthor}
          favoriteGenre={favoriteGenre}
          setFavoriteGenre={setFavoriteGenre}
          bio={bio}
          setBio={setBio}
          allowChats={allowChats}
          setAllowChats={setAllowChats}
          chatRequests={chatRequests}
          activeChatsCount={activeChatsCount}
          onChatAction={handleChatActionRequest}
        />
        
        <ProfileDialogFooter
          isLoading={isLoading}
          showSavedMessage={showSavedMessage}
          onSave={handleSaveProfile}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
