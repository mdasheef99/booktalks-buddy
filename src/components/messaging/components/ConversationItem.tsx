/**
 * Direct Messaging System - Conversation Item Component
 *
 * Individual conversation item for the conversation list, displaying
 * participant info, last message preview, timestamp, and unread count.
 */

import React, { memo } from 'react';
import { DMConversation } from '@/lib/api/messaging/types';
import { formatMessageTime } from '@/lib/api/messaging';
import UserAvatar from '@/components/common/UserAvatar';
import { UserName } from './UserName';

interface ConversationItemProps {
  conversation: DMConversation;
  onClick: () => void;
}

/**
 * Individual conversation item component
 * Displays conversation preview with participant, last message, and unread count
 */
export const ConversationItem = memo<ConversationItemProps>(function ConversationItem({ conversation, onClick }) {
  const otherParticipant = conversation.other_participant;
  const lastMessage = conversation.last_message;
  const hasUnread = conversation.unread_count > 0;

  return (
    <div
      onClick={onClick}
      className={`
        p-4 hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100
        ${hasUnread ? 'bg-blue-50/30' : ''}
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Conversation with ${otherParticipant?.displayname || otherParticipant?.username || 'Unknown User'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            <UserAvatar
              userId={otherParticipant?.id || ''}
              size="md"
              className="h-12 w-12"
            />
          </div>

          {/* Conversation Details */}
          <div className="flex-1 min-w-0">
            {/* Participant Name */}
            <div className="flex items-center justify-between mb-1">
              <h3 className={`
                text-sm font-medium truncate
                ${hasUnread ? 'text-gray-900' : 'text-gray-800'}
              `}>
                <UserName
                  user={{
                    id: otherParticipant?.id || '',
                    username: otherParticipant?.username || '',
                    displayname: otherParticipant?.displayname || ''
                  }}
                  showBoth={false}
                />
              </h3>

              {/* Timestamp */}
              {lastMessage && (
                <span className={`
                  text-xs flex-shrink-0 ml-2
                  ${hasUnread ? 'text-bookconnect-sage font-medium' : 'text-gray-500'}
                `}>
                  {formatMessageTime(lastMessage.sent_at)}
                </span>
              )}
            </div>

            {/* Last Message Preview */}
            <div className="flex items-center justify-between">
              <p className={`
                text-sm truncate flex-1
                ${hasUnread ? 'text-gray-700 font-medium' : 'text-gray-500'}
              `}>
                {lastMessage ? (
                  <span>
                    {lastMessage.sender_id === otherParticipant?.id ? '' : 'You: '}
                    {lastMessage.content}
                  </span>
                ) : (
                  <span className="italic">No messages yet</span>
                )}
              </p>

              {/* Unread Count Badge */}
              {hasUnread && (
                <div className="ml-2 bg-bookconnect-terracotta text-white text-xs rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5 flex-shrink-0">
                  {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Skeleton loader for conversation item
 */
export function ConversationItemSkeleton() {
  return (
    <div className="p-4 animate-pulse">
      <div className="flex items-center space-x-3">
        <div className="rounded-full bg-gray-200 h-12 w-12 flex-shrink-0"></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
          </div>
          <div className="flex items-center justify-between">
            <div className="h-3 bg-gray-200 rounded w-48"></div>
            <div className="h-4 bg-gray-200 rounded-full w-6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Empty conversation item for when no conversations exist
 */
export function EmptyConversationItem() {
  return (
    <div className="p-8 text-center">
      <div className="text-gray-400 mb-4">
        <svg
          className="h-16 w-16 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No conversations yet
      </h3>
      <p className="text-gray-500 text-sm">
        Start a conversation to connect with other book lovers
      </p>
    </div>
  );
}

/**
 * Error state for conversation item
 */
export function ConversationItemError({
  onRetry
}: {
  onRetry?: () => void
}) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg m-4">
      <div className="flex items-center">
        <div className="text-red-400 mr-3">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm text-red-800 font-medium">
            Failed to load conversation
          </p>
          <p className="text-xs text-red-600 mt-1">
            Please try again or check your connection
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-red-600 hover:text-red-800 text-sm font-medium ml-3"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Conversation item with loading state
 */
export function ConversationItemWithLoading({
  conversation,
  onClick,
  isLoading = false
}: ConversationItemProps & { isLoading?: boolean }) {
  if (isLoading) {
    return <ConversationItemSkeleton />;
  }

  return (
    <ConversationItem
      conversation={conversation}
      onClick={onClick}
    />
  );
}

/**
 * Conversation item list wrapper with proper spacing
 */
export function ConversationItemList({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="divide-y divide-gray-100">
      {children}
    </div>
  );
}
