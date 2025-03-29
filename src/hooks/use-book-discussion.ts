import { useState, useEffect } from "react";
import { ChatMessage, subscribeToChat, getBookChat, sendChatMessage } from "@/services/chatService";
import * as Sentry from "@sentry/react";
import { toast } from "sonner";

export function useBookDiscussion(id: string, title: string, author: string, username: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([username]); // Current user is always online

  // Load chat history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setConnectionError(false);
        console.log("Loading chat history for book:", id);
        const chatHistory = await getBookChat(id);
        console.log("Got chat history:", chatHistory);
        setMessages(chatHistory);
        
        // Extract unique usernames from chat history
        const uniqueUsernames = new Set<string>();
        chatHistory.forEach(msg => {
          if (msg.username) uniqueUsernames.add(msg.username);
        });
        
        // Add current user to online users
        setOnlineUsers(prev => {
          const newUsers = Array.from(uniqueUsernames);
          if (!newUsers.includes(username)) {
            newUsers.push(username);
          }
          return newUsers;
        });
        
      } catch (error) {
        console.error("Error loading chat history:", error);
        setConnectionError(true);
        Sentry.captureException(error, {
          tags: { component: "BookDiscussion", action: "loadChatHistory" },
          extra: { bookId: id }
        });
        toast.error("Couldn't load chat history. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    };
    
    loadChatHistory();
  }, [id, username]);
  
  // Subscribe to real-time chat updates
  useEffect(() => {
    if (!id) return;
    
    console.log("Setting up real-time subscription for book:", id);
    const subscription = subscribeToChat(id, (newMessage) => {
      console.log("Received new message in component:", newMessage);
      
      // Handle both new messages and updates to existing messages (deletions)
      setMessages((prevMessages) => {
        // Check if this is an update to an existing message
        if (prevMessages.some(msg => msg.id === newMessage.id)) {
          return prevMessages.map(msg => 
            msg.id === newMessage.id ? newMessage : msg
          );
        }
        // Otherwise it's a new message
        return [...prevMessages, newMessage];
      });
      
      // Add user to online users list if not already there
      if (newMessage.username) {
        setOnlineUsers(prev => {
          if (!prev.includes(newMessage.username)) {
            return [...prev, newMessage.username];
          }
          return prev;
        });
      }
      
      setConnectionError(false);
    });
    
    return () => {
      console.log("Unsubscribing from chat");
      subscription.unsubscribe();
    };
  }, [id]);
  
  const handleSendMessage = async (message: string, replyToId?: string) => {
    if (!id || !message.trim()) {
      console.error("Missing required data for sending message");
      return;
    }
    
    try {
      console.log("Sending message:", message, "for book:", id, "as user:", username);
      // Pass the title and author to ensure the book exists in the database
      const result = await sendChatMessage(
        message, 
        id, 
        username, 
        title, 
        author, 
        undefined, 
        replyToId
      );
      
      if (!result) {
        console.error("No result returned from sendChatMessage");
        toast.error("Failed to send message. Please try again.");
        throw new Error("Failed to send message - empty result");
      } else {
        console.log("Message sent successfully:", result);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      Sentry.captureException(error, {
        tags: { component: "BookDiscussion", action: "sendMessage" },
        extra: { bookId: id, username, title, author }
      });
      throw error; // Re-throw so the input component can handle it
    }
  };

  const handleReplyToMessage = (message: ChatMessage) => {
    setReplyTo(message);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  return {
    messages,
    loading,
    connectionError,
    replyTo,
    onlineUsers,
    handleSendMessage,
    handleReplyToMessage,
    handleCancelReply
  };
}
