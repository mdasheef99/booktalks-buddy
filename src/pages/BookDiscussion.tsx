
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChatMessage, subscribeToChat, getBookChat, sendChatMessage } from "@/services/chatService";
import BookDiscussionChat from "@/components/books/BookDiscussionChat";
import BookDiscussionHeader from "@/components/books/BookDiscussionHeader";
import BookDiscussionInput from "@/components/books/BookDiscussionInput";
import * as Sentry from "@sentry/react";

const BookDiscussion: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const title = searchParams.get("title") || "Unknown Book";
  const author = searchParams.get("author") || "Unknown Author";
  const username = localStorage.getItem("username") || "Anonymous Reader";
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load chat history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const chatHistory = await getBookChat(id);
        setMessages(chatHistory);
      } catch (error) {
        console.error("Error loading chat history:", error);
        Sentry.captureException(error, {
          tags: { component: "BookDiscussion", action: "loadChatHistory" },
          extra: { bookId: id }
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadChatHistory();
  }, [id]);
  
  // Subscribe to real-time chat updates
  useEffect(() => {
    if (!id) return;
    
    const subscription = subscribeToChat(id, (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [id]);
  
  const handleSendMessage = async (message: string) => {
    if (!id || !message.trim()) return;
    
    try {
      await sendChatMessage(message, id, username);
    } catch (error) {
      console.error("Error sending message:", error);
      Sentry.captureException(error, {
        tags: { component: "BookDiscussion", action: "sendMessage" },
        extra: { bookId: id, username }
      });
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
      
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4 py-4">
        <div className="flex-1 flex flex-col mb-4 bg-white/80 rounded-lg shadow-md border border-bookconnect-brown/20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1470&auto=format&fit=crop')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundBlendMode: "overlay"
          }}
        >
          <ScrollArea className="flex-1 p-4">
            <BookDiscussionChat 
              messages={messages} 
              loading={loading} 
              currentUsername={username}
            />
          </ScrollArea>
        </div>
        
        <BookDiscussionInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default BookDiscussion;
