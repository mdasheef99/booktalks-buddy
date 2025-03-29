
import React, { useState, useEffect } from "react";
import * as Sentry from "@sentry/react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Edit, Check } from "lucide-react";

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
import { 
  fetchChatRequests, 
  fetchActiveChatsCount, 
  handleChatAction, 
  saveProfile, 
  loadProfileData 
} from "./profileService";
import ReadingActivity from "./ReadingActivity";

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

  // Load profile data
  useEffect(() => {
    const initializeProfile = async () => {
      if (open) {
        const profileData = await loadProfileData();
        if (profileData) {
          if (profileData.username) setUsername(profileData.username);
          if (profileData.favoriteAuthor) setFavoriteAuthor(profileData.favoriteAuthor);
          if (profileData.favoriteGenre) setFavoriteGenre(profileData.favoriteGenre);
          if (profileData.bio) setBio(profileData.bio);
          if (profileData.allowChats !== null) setAllowChats(profileData.allowChats);
          
          // Also update localStorage
          localStorage.setItem("username", profileData.username);
        }
        
        const requests = await fetchChatRequests();
        setChatRequests(requests);
        
        const chatsCount = await fetchActiveChatsCount();
        setActiveChatsCount(chatsCount);
      }
    };

    initializeProfile();
  }, [open]);

  // Set up realtime subscription for chat requests
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
      
      toast({
        title: "Profile saved!",
        description: "Your changes have been saved successfully.",
      });
    } else {
      toast({
        title: "Profile save failed!",
        description: "We couldn't save your profile changes.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const handleChatActionRequest = async (chatId: string, action: 'accept' | 'reject') => {
    const success = await handleChatAction(chatId, action);
    
    if (success) {
      // Remove this request from the list
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
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md mx-auto bg-bookconnect-cream" 
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
        <DialogHeader>
          <DialogTitle className="text-2xl text-center font-serif text-bookconnect-brown">
            Library Card
          </DialogTitle>
          <div className="mx-auto w-3/4 h-px bg-bookconnect-brown/50 my-2" />
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          <div className="space-y-4 py-2 font-serif px-4">
            {/* Username */}
            <UsernameEditor username={username} setUsername={setUsername} />

            {/* Profile Form */}
            <ProfileForm 
              favoriteAuthor={favoriteAuthor}
              setFavoriteAuthor={setFavoriteAuthor}
              favoriteGenre={favoriteGenre}
              setFavoriteGenre={setFavoriteGenre}
              bio={bio}
              setBio={setBio}
            />

            {/* Chat Settings */}
            <ChatSettings 
              allowChats={allowChats}
              setAllowChats={setAllowChats}
              activeChatsCount={activeChatsCount}
            />

            {/* Chat Requests */}
            {chatRequests.length > 0 && (
              <ChatRequestsList 
                chatRequests={chatRequests}
                onChatAction={handleChatActionRequest}
              />
            )}

            {/* Previous Chats */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-bookconnect-brown flex items-center justify-between">
                Previous Chats 
                <Button variant="ghost" size="icon" className="text-bookconnect-brown/70 hover:text-bookconnect-brown" title="Edit previous chats">
                  <Edit className="h-4 w-4" />
                </Button>
              </h3>
              <div className="text-center py-8 text-muted-foreground bg-white/70 rounded-md mt-2">
                <p className="text-sm">No previous chats yet.</p>
                <p className="text-sm">Join discussions to see your chat history here!</p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex flex-col gap-2">
          {showSavedMessage && (
            <div className="text-center text-sm text-green-600 bg-green-50 rounded-md p-1 mb-1 flex items-center justify-center">
              <Check className="h-4 w-4 mr-1" /> Changes saved successfully
            </div>
          )}
          <Button 
            onClick={handleSaveProfile} 
            className="w-full bg-bookconnect-sage hover:bg-bookconnect-sage/90"
            disabled={isLoading}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
