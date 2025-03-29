
import React from "react";
import { ChatMessage } from "@/services/chatService";

interface BookDiscussionChatProps {
  messages: ChatMessage[];
  loading: boolean;
  currentUsername: string;
}

const BookDiscussionChat: React.FC<BookDiscussionChatProps> = ({ 
  messages, 
  loading,
  currentUsername 
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bookconnect-terracotta mx-auto mb-2"></div>
          <p className="text-bookconnect-brown/70 font-serif">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <h3 className="font-serif text-xl font-medium mb-2 text-bookconnect-brown">Start the conversation</h3>
          <p className="text-bookconnect-brown/70 font-serif">
            Be the first to share your thoughts on this book. What did you enjoy most about it?
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <div 
          key={`${message.id}-${message.timestamp}`}
          className={`flex ${message.username === currentUsername ? 'justify-end' : 'justify-start'}`}
        >
          <div 
            className={`max-w-[80%] px-3 py-2 rounded-lg font-serif text-sm
              ${message.username === currentUsername 
                ? 'bg-bookconnect-sage/80 text-white rounded-tr-none' 
                : 'bg-bookconnect-terracotta/20 text-bookconnect-brown rounded-tl-none'
              }`}
          >
            <div className={`text-xs mb-1 ${message.username === currentUsername ? 'text-white/80' : 'text-bookconnect-brown/70'}`}>
              {message.username}
            </div>
            <div style={{ wordBreak: "break-word" }}>{message.message}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BookDiscussionChat;
