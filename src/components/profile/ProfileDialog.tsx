import React, { useState, useEffect } from "react";
import * as Sentry from "@sentry/react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Check } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import UsernameEditor from "./UsernameEditor";
import ProfileForm from "./ProfileForm";
import ChatRequestsList, { ChatRequest } from "./ChatRequestsList";
import ChatSettings from "./ChatSettings";
import ReadingActivity from "./ReadingActivity";
import { 
  fetchChatRequests, 
  fetchActiveChatsCount, 
  handleChatAction, 
  saveProfile, 
  loadProfileData 
} from "./profileService";

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
        <DialogHeader className="relative">
          <div className="pt-2">
            <DialogTitle className="text-2xl text-center font-serif text-bookconnect-brown">
              Profile
            </DialogTitle>
            <div className="mx-auto w-3/4 h-px bg-bookconnect-brown/50 my-2" />
          </div>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 py-2 font-serif px-1">
            <UsernameEditor username={username} setUsername={setUsername} />

            <ProfileForm 
              favoriteAuthor={favoriteAuthor}
              setFavoriteAuthor={setFavoriteAuthor}
              favoriteGenre={favoriteGenre}
              setFavoriteGenre={setFavoriteGenre}
              bio={bio}
              setBio={setBio}
            />

            <ChatSettings 
              allowChats={allowChats}
              setAllowChats={setAllowChats}
              activeChatsCount={activeChatsCount}
            />

            {chatRequests.length > 0 && (
              <ChatRequestsList 
                chatRequests={chatRequests}
                onChatAction={handleChatActionRequest}
              />
            )}

            <ReadingActivity />
          </div>
        </ScrollArea>

        <DialogFooter className="mt-6 pt-4 border-t border-bookconnect-brown/20">
          {showSavedMessage && (
            <div className="text-center text-sm text-green-600 bg-green-50 rounded-md p-1 mb-2 flex items-center justify-center">
              <Check className="h-4 w-4 mr-1" /> Changes saved successfully
            </div>
          )}
          <Button 
            onClick={handleSaveProfile} 
            className="w-full bg-bookconnect-sage hover:bg-bookconnect-terracotta text-white transition-colors border border-bookconnect-brown/30 shadow-md"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
