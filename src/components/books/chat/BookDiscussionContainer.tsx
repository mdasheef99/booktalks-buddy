
import React, { memo } from "react";
import { ChatMessage } from "@/services/chatService";
import BookDiscussionChat from "@/components/books/BookDiscussionChat";
import BookDiscussionInput from "@/components/books/BookDiscussionInput";

interface BookDiscussionContainerProps {
  messages: ChatMessage[];
  loading: boolean;
  connectionError: boolean;
  username: string;
  replyTo: ChatMessage | null;
  onReplyToMessage: (message: ChatMessage) => void;
  onCancelReply: () => void;
  onSendMessage: (message: string, replyToId?: string) => Promise<void>;
  pendingMessages?: number;
  hasMoreMessages?: boolean;
  isLoadingOlderMessages?: boolean;
  onLoadOlderMessages?: () => Promise<void>;
}

const BookDiscussionContainer: React.FC<BookDiscussionContainerProps> = ({
  messages,
  loading,
  connectionError,
  username,
  replyTo,
  onReplyToMessage,
  onCancelReply,
  onSendMessage,
  pendingMessages = 0,
  hasMoreMessages = false,
  isLoadingOlderMessages = false,
  onLoadOlderMessages
}) => {
  return (
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

      {connectionError && (
        <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 px-3 py-2 rounded-md font-serif text-center text-sm animate-pulse mb-3 z-10 mx-4 mt-4">
          Reconnecting to chat server...
        </div>
      )}

      {pendingMessages > 0 && (
        <div className="bg-blue-50 border border-blue-100 text-blue-800 px-3 py-2 rounded-md font-serif text-center text-sm z-10 mx-4 mt-4">
          {pendingMessages} message{pendingMessages !== 1 ? 's' : ''} waiting to be sent...
        </div>
      )}

      {/* Chat area with fixed height to allow scrolling */}
      <div className="absolute top-0 left-0 right-0 bottom-20 overflow-hidden z-10">
        <BookDiscussionChat
          messages={messages}
          loading={loading}
          currentUsername={username}
          onReplyToMessage={onReplyToMessage}
          hasMoreMessages={hasMoreMessages}
          isLoadingOlderMessages={isLoadingOlderMessages}
          onLoadOlderMessages={onLoadOlderMessages}
        />
      </div>

      {/* Fixed input at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 border-t border-bookconnect-brown/20 shadow-[0_-4px_8px_-2px_rgba(0,0,0,0.08)] z-10">
        <BookDiscussionInput
          onSendMessage={onSendMessage}
          replyTo={replyTo}
          onCancelReply={onCancelReply}
        />
      </div>
    </div>
  );
};

export default memo(BookDiscussionContainer);
