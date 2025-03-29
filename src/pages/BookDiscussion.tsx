
import React from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import BookDiscussionHeader from "@/components/books/BookDiscussionHeader";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useBookDiscussion } from "@/hooks/use-book-discussion";
import BookDiscussionContainer from "@/components/books/chat/BookDiscussionContainer";

const BookDiscussion: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const title = searchParams.get("title") || "Unknown Book";
  const author = searchParams.get("author") || "Unknown Author";
  // Use anon_username if available, otherwise fall back to username, then Anonymous Reader
  const username = localStorage.getItem("anon_username") || localStorage.getItem("username") || "Anonymous Reader";
  
  const {
    messages,
    loading,
    connectionError,
    replyTo,
    onlineUsers,
    handleSendMessage,
    handleReplyToMessage,
    handleCancelReply
  } = useBookDiscussion(id || "", title, author, username);
  
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
          onlineUsers={onlineUsers}
        />
        
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 pb-4">
          <BookDiscussionContainer
            messages={messages}
            loading={loading}
            connectionError={connectionError}
            username={username}
            replyTo={replyTo}
            onReplyToMessage={handleReplyToMessage}
            onCancelReply={handleCancelReply}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </TooltipProvider>
  );
};

export default BookDiscussion;
