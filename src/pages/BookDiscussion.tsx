
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ChatMessage, subscribeToChat, getBookChat, sendChatMessage } from "@/services/chatService";
import BookDiscussionChat from "@/components/books/BookDiscussionChat";
import BookDiscussionHeader from "@/components/books/BookDiscussionHeader";
import BookDiscussionInput from "@/components/books/BookDiscussionInput";
import * as Sentry from "@sentry/react";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const BookDiscussion: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const title = searchParams.get("title") || "Unknown Book";
  const author = searchParams.get("author") || "Unknown Author";
  // Use anon_username if available, otherwise fall back to username, then Anonymous Reader
  const username = localStorage.getItem("anon_username") || localStorage.getItem("username") || "Anonymous Reader";
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  
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
  }, [id]);
  
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
  
  const handleBack = () => {
    navigate("/explore-books");
  };
  
  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-bookconnect-parchment bg-opacity-70">
        <BookDiscussionHeader 
          title={title} 
          author={author} 
          onBack={handleBack} 
        />
        
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 pb-4">
          {connectionError && (
            <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 px-3 py-2 rounded-md font-serif text-center text-sm animate-pulse mb-3">
              Reconnecting to chat server...
            </div>
          )}
          
          <div 
            className="flex-1 flex flex-col bg-white/95 rounded-xl shadow-xl border border-bookconnect-brown/10 overflow-hidden relative"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1470&auto=format&fit=crop')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundBlendMode: "overlay",
              minHeight: "calc(100vh - 180px)"
            }}
          >
            {/* Add a semi-transparent overlay for better contrast */}
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-0"></div>
            
            {/* Chat area with fixed height to allow scrolling */}
            <div className="absolute top-0 left-0 right-0 bottom-20 overflow-hidden z-10">
              <BookDiscussionChat 
                messages={messages} 
                loading={loading} 
                currentUsername={username}
                onReplyToMessage={handleReplyToMessage}
              />
            </div>
            
            {/* Fixed input at the bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 border-t border-bookconnect-brown/20 shadow-[0_-4px_8px_-2px_rgba(0,0,0,0.08)] z-10">
              <BookDiscussionInput 
                onSendMessage={handleSendMessage} 
                replyTo={replyTo}
                onCancelReply={handleCancelReply}
              />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default BookDiscussion;
