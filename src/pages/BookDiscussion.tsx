
import React, { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage, subscribeToChat, getBookChat, sendChatMessage } from "@/services/chatService";
import BookDiscussionChat from "@/components/books/BookDiscussionChat";
import BookDiscussionHeader from "@/components/books/BookDiscussionHeader";
import BookDiscussionInput from "@/components/books/BookDiscussionInput";
import * as Sentry from "@sentry/react";
import { toast } from "sonner";

const BookDiscussion: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const title = searchParams.get("title") || "Unknown Book";
  const author = searchParams.get("author") || "Unknown Author";
  const username = localStorage.getItem("username") || "Anonymous Reader";
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  
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
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setConnectionError(false);
    });
    
    return () => {
      console.log("Unsubscribing from chat");
      subscription.unsubscribe();
    };
  }, [id]);
  
  const handleSendMessage = async (message: string) => {
    if (!id || !message.trim()) {
      console.error("Missing required data for sending message");
      return;
    }
    
    try {
      console.log("Sending message:", message, "for book:", id, "as user:", username);
      // Pass the title and author to ensure the book exists in the database
      const result = await sendChatMessage(message, id, username, title, author);
      
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
  
  const handleBack = () => {
    navigate("/explore-books");
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-bookconnect-cream">
      <BookDiscussionHeader 
        title={title} 
        author={author} 
        onBack={handleBack} 
      />
      
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4 py-2">
        {connectionError && (
          <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 px-3 py-1 rounded font-serif text-center text-sm animate-pulse mb-2">
            Reconnecting to chat server...
          </div>
        )}
        
        <div className="flex-1 flex flex-col bg-white/80 rounded-lg shadow-md border border-bookconnect-brown/20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1470&auto=format&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundBlendMode: "overlay",
            minHeight: "calc(100vh - 100px)"
          }}
        >
          <div className="flex-1 overflow-auto p-4">
            <BookDiscussionChat 
              messages={messages} 
              loading={loading} 
              currentUsername={username}
            />
          </div>
        </div>
        
        <div className="mt-2">
          <BookDiscussionInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
};

export default BookDiscussion;
