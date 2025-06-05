/**
 * Direct Messaging System - Message Thread Page
 *
 * Individual conversation view showing message history with real-time updates,
 * message input, and proper conversation management.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getConversationMessages,
  sendMessage,
  deleteMessage,
  markConversationAsRead,
  getConversationDetails
} from '@/lib/api/messaging';
import { MessageItem } from '../components/MessageItem';
import { MessageInput } from '../components/MessageInput';
import { ConversationHeader } from '../components/MessagingHeader';
import { DateSeparator, groupMessagesByDate } from '../components/DateSeparator';
import { ReplyPreview } from '../components/ReplyPreview';
import { useRealtimeMessages } from '../hooks/useRealtimeMessages';
import { DMMessage } from '@/lib/api/messaging/types';
import { toast } from 'sonner';

/**
 * Main message thread page component
 * Displays conversation messages with real-time updates and message input
 */
export function MessageThreadPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [replyingTo, setReplyingTo] = useState<DMMessage | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  // Fetch conversation details
  const {
    data: conversationDetails,
    isLoading: isLoadingDetails,
    error: detailsError
  } = useQuery({
    queryKey: ['conversationDetails', conversationId],
    queryFn: () => getConversationDetails(conversationId!, user!.id),
    enabled: !!conversationId && !!user?.id
  });

  // Fetch messages
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    error: messagesError
  } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getConversationMessages({ conversationId: conversationId!, userId: user!.id }),
    enabled: !!conversationId && !!user?.id,
    refetchOnWindowFocus: false
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ content, replyToId }: { content: string; replyToId?: string }) =>
      sendMessage(user!.id, conversationId!, content, replyToId),
    onSuccess: (newMessage) => {
      // Immediately add message to cache for instant UI feedback
      queryClient.setQueryData(['messages', conversationId], (oldData: any) => {
        if (!oldData) return { messages: [newMessage], has_more: false };
        return {
          ...oldData,
          messages: [...oldData.messages, newMessage]
        };
      });

      // Update conversations list cache
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send message');
    }
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => deleteMessage(messageId, user!.id),
    onSuccess: (_, messageId) => {
      // Update message in cache to show as deleted
      queryClient.setQueryData(['messages', conversationId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          messages: oldData.messages.map((msg: any) =>
            msg.id === messageId
              ? { ...msg, is_deleted: true }
              : msg
          )
        };
      });
      toast.success('Message deleted');
    },
    onError: (error: Error) => {
      console.error('Error deleting message:', error);
      toast.error(error.message || 'Failed to delete message');
    }
  });

  // Real-time message subscription
  useRealtimeMessages(conversationId!, (newMessage) => {
    queryClient.setQueryData(['messages', conversationId], (oldData: any) => {
      if (!oldData) return { messages: [newMessage], has_more: false };

      // Avoid duplicates
      const messageExists = oldData.messages.some((msg: any) => msg.id === newMessage.id);
      if (messageExists) return oldData;

      return {
        ...oldData,
        messages: [...oldData.messages, newMessage]
      };
    });
  });

  // Mark as read when messages load
  useEffect(() => {
    if (messagesData?.messages.length && conversationId && user?.id) {
      markConversationAsRead(conversationId, user.id);
    }
  }, [messagesData, conversationId, user?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData?.messages]);

  /**
   * Handle sending a new message
   */
  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;
    sendMessageMutation.mutate({
      content,
      replyToId: replyingTo?.id
    });
    setReplyingTo(null); // Clear reply after sending
  };

  /**
   * Handle reply to message
   */
  const handleReply = (messageId: string) => {
    const message = messagesData?.messages.find(m => m.id === messageId);
    if (message) {
      setReplyingTo(message);
    }
  };

  /**
   * Handle cancel reply
   */
  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  /**
   * Handle delete message
   */
  const handleDelete = (messageId: string) => {
    deleteMessageMutation.mutate(messageId);
  };

  /**
   * Handle scroll to replied message
   */
  const handleScrollToReply = (messageId: string) => {
    // Find the message element and scroll to it
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      // Highlight the message temporarily
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 2000);
    }
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    navigate('/messages');
  };

  /**
   * Handle navigation back to previous page using browser history
   */
  const handleGoBack = () => {
    navigate(-1);
  };

  /**
   * Get other participant info for header
   */
  const getOtherParticipant = () => {
    if (!conversationDetails) return null;
    return conversationDetails.participants.find(p => p.id !== user?.id);
  };

  const otherParticipant = getOtherParticipant();
  const isLoading = isLoadingDetails || isLoadingMessages;
  const error = detailsError || messagesError;

  // Error state
  if (error) {
    return (
      <div className="max-w-md mx-auto h-screen flex items-center justify-center bg-white">
        <div className="text-center p-6">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-red-500 mb-4 font-medium">Failed to load conversation</p>
          <p className="text-gray-600 text-sm mb-4">
            This conversation may not exist or you don't have permission to view it
          </p>
          <button
            onClick={handleBack}
            className="bg-bookconnect-sage text-white px-4 py-2 rounded hover:bg-bookconnect-sage/90"
          >
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white shadow-xl">
      {/* Header */}
      <ConversationHeader
        participantName={otherParticipant?.displayname || otherParticipant?.username || 'Loading...'}
        participantUsername={otherParticipant?.username}
        onBack={handleBack}
        onGoBack={handleGoBack}
        isOnline={false} // TODO: Implement online status
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-gradient-to-b from-gray-50/30 to-transparent">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`animate-pulse flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} mb-4`}>
                <div className={`max-w-lg p-5 rounded-2xl shadow-md ${
                  i % 2 === 0 ? 'bg-gray-200' : 'bg-gray-100'
                }`}>
                  <div className="h-5 bg-gray-300 rounded w-32 mb-3"></div>
                  <div className="h-4 bg-gray-300 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : messagesData?.messages.length === 0 ? (
          // Empty state
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">
                No messages yet. Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          // Messages list with date grouping
          <>
            {groupMessagesByDate(messagesData?.messages || []).map((item, index) => {
              if (item.type === 'date') {
                return (
                  <DateSeparator
                    key={`date-${item.date}-${index}`}
                    date={item.date}
                  />
                );
              } else {
                return (
                  <MessageItem
                    key={item.message.id}
                    message={item.message}
                    isOwn={item.message.sender_id === user?.id}
                    onReply={handleReply}
                    onDelete={handleDelete}
                    onScrollToReply={handleScrollToReply}
                    isHighlighted={highlightedMessageId === item.message.id}
                  />
                );
              }
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <ReplyPreview
          replyingTo={replyingTo}
          onCancel={handleCancelReply}
        />
      )}

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={sendMessageMutation.isPending || isLoading}
        placeholder={
          replyingTo
            ? `Reply to ${replyingTo.sender.displayname || replyingTo.sender.username}...`
            : otherParticipant
            ? `Message ${otherParticipant.displayname || otherParticipant.username}...`
            : "Type a message..."
        }
      />
    </div>
  );
}

/**
 * Loading skeleton for message thread page
 */
export function MessageThreadSkeleton() {
  return (
    <div className="max-w-2xl mx-auto h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white shadow-xl">
      {/* Header skeleton */}
      <div className="px-6 py-5 border-b bg-gradient-to-r from-bookconnect-sage to-bookconnect-sage/95 animate-pulse">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-white/20 rounded-full mr-4"></div>
          <div className="flex-1">
            <div className="h-6 bg-white/20 rounded w-40 mb-2"></div>
            <div className="h-4 bg-white/20 rounded w-28"></div>
          </div>
        </div>
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 px-6 py-6 space-y-6 bg-gradient-to-b from-gray-50/30 to-transparent">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`animate-pulse flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-lg p-5 rounded-2xl shadow-md ${
              i % 2 === 0 ? 'bg-gray-200' : 'bg-gray-100'
            }`}>
              <div className="h-5 bg-gray-300 rounded w-36 mb-3"></div>
              <div className="h-4 bg-gray-300 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Input skeleton */}
      <div className="px-6 py-5 border-t bg-gradient-to-t from-white to-gray-50/30 animate-pulse">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3">
          <div className="flex gap-3">
            <div className="flex-1 h-11 bg-gray-200 rounded-xl"></div>
            <div className="w-11 h-11 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
