
import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import BookDiscussionHeader from "@/components/books/BookDiscussionHeader";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useBookDiscussion } from "@/hooks/use-book-discussion";
import BookDiscussionContainer from "@/components/books/chat/BookDiscussionContainer";
import { getBookDiscussionId, isUuid } from "@/services/base/supabaseService";
import { getCurrentUsername } from "@/services/chat/models";

const BookDiscussion: React.FC = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Ensure we're using the original Google Books ID
  const id = paramId ? (isUuid(paramId) ? getBookDiscussionId(paramId) : paramId) : "";

  const title = searchParams.get("title") || "Unknown Book";
  const author = searchParams.get("author") || "Unknown Author";
  const coverUrl = searchParams.get("coverUrl") || "";

  // Use state to store the username so we can update it
  const [username, setUsername] = useState(getCurrentUsername());

  // Update username when window gains focus or when username changes
  useEffect(() => {
    const handleFocus = () => {
      const currentUsername = getCurrentUsername();
      if (currentUsername !== username) {
        setUsername(currentUsername);
        console.log("Username updated from localStorage:", currentUsername);
      }
    };

    // Handle custom username change event
    const handleUsernameChanged = (event: CustomEvent) => {
      const { username: newUsername } = event.detail;
      if (newUsername && newUsername !== username) {
        setUsername(newUsername);
        console.log("Username updated from event:", newUsername);
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('usernameChanged', handleUsernameChanged as EventListener);

    // Also check periodically for username changes
    const intervalId = setInterval(handleFocus, 5000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('usernameChanged', handleUsernameChanged as EventListener);
      clearInterval(intervalId);
    };
  }, [username]);

  console.log("BookDiscussion - Param ID:", paramId, "Normalized ID:", id, "Title:", title, "Author:", author, "Cover URL:", coverUrl);

  const {
    messages,
    loading,
    connectionError,
    replyTo,
    onlineUsers,
    handleSendMessage,
    handleReplyToMessage,
    handleCancelReply
  } = useBookDiscussion(id || "", title, author, username, coverUrl);

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
