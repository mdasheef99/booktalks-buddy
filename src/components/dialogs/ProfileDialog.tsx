
import React, { useState, useEffect } from "react";
import * as Sentry from "@sentry/react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validateUsername } from "@/utils/usernameGenerator";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Edit, Bell } from "lucide-react";

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ChatRequest {
  id: string;
  requester_id: string;
  requester_username: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

const GENRE_OPTIONS = [
  "Fiction", "Mystery", "Sci-Fi", "Romance", "Fantasy", 
  "Thriller", "Non-Fiction", "Biography", "Poetry", 
  "History", "Young Adult", "Classics"
];

const ProfileDialog: React.FC<ProfileDialogProps> = ({ open, onClose }) => {
  const { toast } = useToast();
  const [username, setUsername] = useState<string>(() => localStorage.getItem("username") || "");
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
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

  // Load profile data
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // Get the user's ID from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const { data, error } = await supabase
            .from('users')
            .select('username, favorite_author, favorite_genre, bio, allow_chats')
            .eq('id', session.user.id)
            .single();
          
          if (error) throw error;
          
          if (data) {
            // Set the states with the retrieved data
            if (data.username) setUsername(data.username);
            if (data.favorite_author) setFavoriteAuthor(data.favorite_author);
            if (data.favorite_genre) setFavoriteGenre(data.favorite_genre);
            if (data.bio) setBio(data.bio);
            if (data.allow_chats !== null) setAllowChats(data.allow_chats);
            
            // Also update localStorage
            localStorage.setItem("username", data.username || username);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        Sentry.captureException(error, {
          tags: {
            component: "ProfileDialog",
            action: "loadProfileData"
          }
        });
      }
    };

    if (open) {
      loadProfileData();
      fetchChatRequests();
      fetchActiveChatsCount();
    }
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
        (payload) => {
          console.log('New chat request received:', payload);
          fetchChatRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open]);

  const fetchChatRequests = async () => {
    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) return;

      const { data, error } = await supabase
        .from('private_chats')
        .select(`
          id, 
          requester_id,
          users!private_chats_requester_id_fkey(username),
          receiver_id, 
          status, 
          created_at
        `)
        .eq('receiver_id', userId)
        .eq('status', 'pending');
      
      if (error) throw error;

      if (data) {
        // Format the data to extract the username from the joined users table
        const formattedRequests = data.map(item => ({
          id: item.id,
          requester_id: item.requester_id,
          requester_username: item.users?.username || 'Anonymous',
          receiver_id: item.receiver_id,
          status: item.status,
          created_at: item.created_at
        }));

        setChatRequests(formattedRequests);
      }
    } catch (error) {
      console.error("Error fetching chat requests:", error);
      Sentry.captureException(error, {
        tags: {
          component: "ProfileDialog",
          action: "fetchChatRequests"
        }
      });
    }
  };

  const fetchActiveChatsCount = async () => {
    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) return;

      // Count chats where the user is either requester or receiver and status is 'accepted'
      const { count, error } = await supabase
        .from('private_chats')
        .select('*', { count: 'exact', head: true })
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'accepted');
      
      if (error) throw error;
      
      setActiveChatsCount(count || 0);
    } catch (error) {
      console.error("Error fetching active chats count:", error);
    }
  };

  const handleStartEditing = () => {
    setNewUsername(username);
    setEditingUsername(true);
  };

  const handleSaveUsername = () => {
    if (!validateUsername(newUsername)) {
      toast({
        title: "Name too short!",
        description: "Username must be at least 3 characters and contain no special characters.",
        variant: "destructive",
      });
      
      Sentry.captureMessage("Invalid username attempt", {
        tags: {
          component: "ProfileDialog",
          action: "handleSaveUsername"
        },
        extra: {
          username: newUsername
        }
      });
      
      return;
    }

    setUsername(newUsername);
    localStorage.setItem("username", newUsername);
    setEditingUsername(false);
    
    toast({
      title: "Username updated!",
      description: `You are now known as ${newUsername}`,
    });
  };

  const handleCancelEditUsername = () => {
    setEditingUsername(false);
    setNewUsername("");
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    
    try {
      // Try to save to Supabase if a user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        const { error } = await supabase
          .from('users')
          .update({ 
            username, 
            favorite_author: favoriteAuthor,
            favorite_genre: favoriteGenre,
            bio,
            allow_chats: allowChats
          })
          .eq('id', session.user.id);

        if (error) throw error;
      }
      
      // Always update localStorage
      localStorage.setItem("username", username);
      localStorage.setItem("favorite_genre", favoriteGenre);
      
      toast({
        title: "Profile saved!",
        description: "Your changes have been saved successfully.",
      });
      
      onClose();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Profile save failed!",
        description: "We couldn't save your profile changes.",
        variant: "destructive",
      });
      
      Sentry.captureException(error, {
        tags: {
          component: "ProfileDialog",
          action: "handleSaveProfile"
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatAction = async (chatId: string, action: 'accept' | 'reject') => {
    try {
      const status = action === 'accept' ? 'accepted' : 'rejected';
      
      const { error } = await supabase
        .from('private_chats')
        .update({ status })
        .eq('id', chatId);
        
      if (error) throw error;
      
      // Remove this request from the list
      setChatRequests(prev => prev.filter(req => req.id !== chatId));
      
      if (action === 'accept') {
        setActiveChatsCount(prev => prev + 1);
        toast({
          title: "Chat request accepted!",
          description: "You can now start chatting with this user."
        });
        // Note: In a full implementation, you might want to redirect to the chat window
      } else {
        toast({
          title: "Chat request rejected",
          description: "The request has been declined."
        });
      }
    } catch (error) {
      console.error(`Error ${action}ing chat request:`, error);
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

        <div className="space-y-4 py-2 font-serif">
          {/* Username */}
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-bookconnect-brown">
              Username
            </label>
            
            {editingUsername ? (
              <div className="flex items-center gap-2">
                <Input
                  id="username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="font-mono"
                  style={{ borderColor: '#B8A088' }}
                  maxLength={20}
                />
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={handleSaveUsername}
                  className="text-bookconnect-sage hover:text-bookconnect-sage/90"
                  title="Save username"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={handleCancelEditUsername}
                  className="text-bookconnect-terracotta hover:text-bookconnect-terracotta/90"
                  title="Cancel editing"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="font-mono text-bookconnect-brown/90">{username}</span>
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={handleStartEditing}
                  className="text-bookconnect-brown/70 hover:text-bookconnect-brown"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Favorite Author */}
          <div className="space-y-2">
            <label htmlFor="favoriteAuthor" className="block text-sm font-medium text-bookconnect-brown">
              Favorite Author
            </label>
            <Input
              id="favoriteAuthor"
              value={favoriteAuthor}
              onChange={(e) => setFavoriteAuthor(e.target.value)}
              placeholder="Favorite Author"
              className="font-serif"
              maxLength={50}
              style={{ borderColor: '#B8A088' }}
            />
          </div>

          {/* Favorite Genre */}
          <div className="space-y-2">
            <label htmlFor="favoriteGenre" className="block text-sm font-medium text-bookconnect-brown">
              Favorite Genre
            </label>
            <Select value={favoriteGenre} onValueChange={setFavoriteGenre}>
              <SelectTrigger className="font-serif" style={{ borderColor: '#B8A088' }}>
                <SelectValue placeholder="Select a genre" />
              </SelectTrigger>
              <SelectContent>
                {GENRE_OPTIONS.map((genre) => (
                  <SelectItem key={genre} value={genre} className="font-serif">
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Private Chats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-bookconnect-brown">
                Private Chats
                {activeChatsCount > 0 && (
                  <Badge className="ml-2 bg-bookconnect-terracotta" variant="default">
                    {activeChatsCount} {activeChatsCount === 1 ? "chat" : "chats"}
                  </Badge>
                )}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-bookconnect-brown/80">
                  Allow requests
                </span>
                <Switch 
                  checked={allowChats} 
                  onCheckedChange={setAllowChats} 
                />
              </div>
            </div>

            {/* Chat Requests */}
            {chatRequests.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {chatRequests.map((request) => (
                  <div 
                    key={request.id}
                    className="p-2 border border-bookconnect-brown/30 rounded bg-white/70 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-bookconnect-brown">
                        {request.requester_username} wants to chat
                      </span>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => handleChatAction(request.id, 'accept')}
                          style={{ transform: 'rotate(-5deg)' }}
                        >
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleChatAction(request.id, 'reject')}
                          style={{ transform: 'rotate(3deg)' }}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 italic text-sm text-bookconnect-brown/50">
                No pending chat requests
              </div>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label htmlFor="bio" className="block text-sm font-medium text-bookconnect-brown">
              Bio
            </label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="About me"
              className="font-serif"
              maxLength={50}
              style={{ borderColor: '#B8A088' }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleSaveProfile} 
            className="w-full bg-bookconnect-sage hover:bg-bookconnect-sage/90"
            disabled={isLoading}
          >
            Save & Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
