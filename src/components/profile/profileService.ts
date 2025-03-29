
import * as Sentry from "@sentry/react";
import { supabase } from "@/integrations/supabase/client";
import { ChatRequest } from "./ChatRequestsList";

export const fetchChatRequests = async (): Promise<ChatRequest[]> => {
  try {
    const userId = localStorage.getItem("user_id");
    if (!userId) return [];

    // First, get the chat requests
    const { data, error } = await supabase
      .from('private_chats')
      .select('id, requester_id, receiver_id, status, created_at')
      .eq('receiver_id', userId)
      .eq('status', 'pending');
    
    if (error) throw error;
    
    if (!data || data.length === 0) return [];
    
    // Then, get the usernames for each requester
    const chatRequests: ChatRequest[] = [];
    
    for (const request of data) {
      // Get requester username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('username')
        .eq('id', request.requester_id)
        .single();
      
      if (userError) {
        console.error("Error fetching username:", userError);
        // Still add the request but with default username
        chatRequests.push({
          id: request.id,
          requester_id: request.requester_id,
          requester_username: 'Anonymous',
          receiver_id: request.receiver_id,
          status: 'pending',
          created_at: request.created_at
        });
        continue;
      }
      
      chatRequests.push({
        id: request.id,
        requester_id: request.requester_id,
        requester_username: userData?.username || 'Anonymous',
        receiver_id: request.receiver_id,
        status: 'pending',
        created_at: request.created_at
      });
    }
    
    return chatRequests;
  } catch (error) {
    console.error("Error fetching chat requests:", error);
    Sentry.captureException(error, {
      tags: {
        component: "profileService",
        action: "fetchChatRequests"
      }
    });
    return [];
  }
};

export const fetchActiveChatsCount = async (): Promise<number> => {
  try {
    const userId = localStorage.getItem("user_id");
    if (!userId) return 0;

    // Count chats where the user is either requester or receiver and status is 'accepted'
    const { count, error } = await supabase
      .from('private_chats')
      .select('*', { count: 'exact', head: true })
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted');
    
    if (error) throw error;
    
    return count || 0;
  } catch (error) {
    console.error("Error fetching active chats count:", error);
    return 0;
  }
};

export const handleChatAction = async (chatId: string, action: 'accept' | 'reject'): Promise<boolean> => {
  try {
    const status = action === 'accept' ? 'accepted' : 'rejected';
    
    const { error } = await supabase
      .from('private_chats')
      .update({ status })
      .eq('id', chatId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error(`Error ${action}ing chat request:`, error);
    return false;
  }
};

export const saveProfile = async (
  username: string, 
  favoriteAuthor: string, 
  favoriteGenre: string, 
  bio: string, 
  allowChats: boolean
): Promise<boolean> => {
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
    
    return true;
  } catch (error) {
    console.error("Error saving profile:", error);
    Sentry.captureException(error, {
      tags: {
        component: "profileService",
        action: "saveProfile"
      }
    });
    return false;
  }
};

export const loadProfileData = async (): Promise<{
  username: string;
  favoriteAuthor: string;
  favoriteGenre: string;
  bio: string;
  allowChats: boolean;
} | null> => {
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
        return {
          username: data.username || localStorage.getItem("username") || "",
          favoriteAuthor: data.favorite_author || "",
          favoriteGenre: data.favorite_genre || "Fiction",
          bio: data.bio || "",
          allowChats: data.allow_chats !== null ? data.allow_chats : true
        };
      }
    }
    
    return {
      username: localStorage.getItem("username") || "",
      favoriteAuthor: "",
      favoriteGenre: localStorage.getItem("favorite_genre") || "Fiction",
      bio: "",
      allowChats: true
    };
  } catch (error) {
    console.error("Error loading profile:", error);
    Sentry.captureException(error, {
      tags: {
        component: "profileService",
        action: "loadProfileData"
      }
    });
    return null;
  }
};
