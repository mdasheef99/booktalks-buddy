/**
 * Direct Messaging System - Message Item Component
 *
 * Individual message bubble component with sender info, timestamp,
 * and proper styling for own vs other messages.
 */

import React, { memo } from 'react';
import { DMMessage } from '@/lib/api/messaging/types';
import { formatMessageTime, isMessageFromToday } from '@/lib/api/messaging';
import { UserName } from './UserName';
import { MessageActions } from './MessageActions';
import { ReplyIndicator } from './ReplyPreview';

interface MessageItemProps {
  message: DMMessage;
  isOwn: boolean;
  showSender?: boolean;
  onReply?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onScrollToReply?: (messageId: string) => void;
  isHighlighted?: boolean;
  className?: string;
}

/**
 * Individual message bubble component
 * Displays message content with appropriate styling for sender/receiver
 */
export const MessageItem = memo<MessageItemProps>(function MessageItem({
  message,
  isOwn,
  showSender = true,
  onReply,
  onDelete,
  onScrollToReply,
  isHighlighted = false,
  className = ''
}) {
  const messageTime = formatMessageTime(message.sent_at);
  const isToday = isMessageFromToday(message.sent_at);

  // Handle deleted messages
  if (message.is_deleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${className}`}>
        <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 border border-gray-200">
          <div className="text-sm text-gray-500 italic">
            This message was deleted
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {isToday ? messageTime : `${messageTime} • ${new Date(message.sent_at).toLocaleDateString()}`}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        flex ${isOwn ? 'justify-end' : 'justify-start'} group transition-all duration-300
        ${isHighlighted ? 'bg-yellow-100 rounded-lg p-2 -m-2' : ''}
        ${className}
      `}
      data-message-id={message.id}
    >
      <div className="max-w-md lg:max-w-xl relative">
        {/* Reply indicator for replied messages */}
        {message.replied_message && (
          <ReplyIndicator
            repliedMessage={message.replied_message}
            onClick={() => onScrollToReply?.(message.replied_message!.id)}
            className="mb-1"
          />
        )}

        <div
          className={`
            px-5 py-4 rounded-lg shadow-sm relative min-h-[70px]
            ${isOwn
              ? 'bg-bookconnect-sage text-white'
              : 'bg-gray-200 text-gray-900'
            }
          `}
        >
          {/* Message Actions */}
          {(onReply || onDelete) && (
            <div className={`absolute top-2 ${isOwn ? 'right-2' : 'right-2'} z-10`}>
              <MessageActions
                messageId={message.id}
                isOwn={isOwn}
                onReply={onReply || (() => {})}
                onDelete={onDelete || (() => {})}
              />
            </div>
          )}

          {/* Sender name for received messages */}
          {!isOwn && showSender && (
            <div className="text-xs font-medium mb-1 opacity-75">
              <UserName
                user={{
                  id: message.sender_id,
                  username: message.sender.username,
                  displayname: message.sender.displayname
                }}
                showBoth={false}
              />
            </div>
          )}

          {/* Message content */}
          <div className="text-sm whitespace-pre-wrap break-words leading-relaxed pr-8">
            {message.content}
          </div>

          {/* Timestamp */}
          <div className={`
            text-xs mt-1 text-right
            ${isOwn ? 'text-white/70' : 'text-gray-500'}
          `}>
            {messageTime}
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Message item with date separator
 */
export function MessageItemWithDate({
  message,
  isOwn,
  showDateSeparator = false,
  dateLabel,
  className = ''
}: MessageItemProps & {
  showDateSeparator?: boolean;
  dateLabel?: string;
}) {
  return (
    <>
      {showDateSeparator && (
        <DateSeparator
          label={dateLabel || new Date(message.sent_at).toLocaleDateString()}
        />
      )}
      <MessageItem
        message={message}
        isOwn={isOwn}
        className={className}
      />
    </>
  );
}

/**
 * Date separator component for message groups
 */
export function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
        {label}
      </div>
    </div>
  );
}

/**
 * Message item skeleton for loading states
 */
export function MessageItemSkeleton({
  isOwn = false,
  className = ''
}: {
  isOwn?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${className}`}>
      <div className={`
        max-w-xs p-3 rounded-lg animate-pulse
        ${isOwn ? 'bg-gray-300' : 'bg-gray-200'}
      `}>
        {!isOwn && (
          <div className="h-3 bg-gray-400 rounded w-16 mb-2"></div>
        )}
        <div className="space-y-2">
          <div className="h-4 bg-gray-400 rounded w-24"></div>
          <div className="h-4 bg-gray-400 rounded w-32"></div>
        </div>
        <div className="h-3 bg-gray-400 rounded w-12 mt-2 ml-auto"></div>
      </div>
    </div>
  );
}

/**
 * System message component for notifications
 */
export function SystemMessage({
  content,
  timestamp,
  className = ''
}: {
  content: string;
  timestamp?: string;
  className?: string;
}) {
  return (
    <div className={`flex justify-center my-4 ${className}`}>
      <div className="bg-gray-100 text-gray-600 text-xs px-3 py-2 rounded-lg max-w-xs text-center">
        <div className="mb-1">{content}</div>
        {timestamp && (
          <div className="text-gray-500">
            {formatMessageTime(timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Message group component for consecutive messages from same sender
 */
export function MessageGroup({
  messages,
  isOwn,
  className = ''
}: {
  messages: DMMessage[];
  isOwn: boolean;
  className?: string;
}) {
  if (messages.length === 0) return null;

  return (
    <div className={`space-y-1 ${className}`}>
      {messages.map((message, index) => (
        <MessageItem
          key={message.id}
          message={message}
          isOwn={isOwn}
          showSender={index === 0} // Only show sender for first message in group
        />
      ))}
    </div>
  );
}

/**
 * Message with status indicators (delivered, read, etc.)
 */
export function MessageItemWithStatus({
  message,
  isOwn,
  status = 'sent',
  className = ''
}: MessageItemProps & {
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}) {
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'sent':
        return (
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'delivered':
        return (
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'read':
        return (
          <div className="flex">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <svg className="h-3 w-3 -ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'failed':
        return (
          <svg className="h-3 w-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${className}`}>
      <div
        className={`
          max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm
          ${isOwn
            ? 'bg-bookconnect-sage text-white'
            : 'bg-gray-200 text-gray-900'
          }
        `}
      >
        {!isOwn && (
          <div className="text-xs font-medium mb-1 opacity-75">
            <UserName
              user={{
                username: message.sender.username,
                displayname: message.sender.displayname
              }}
              showBoth={false}
              fallback="Unknown User"
            />
          </div>
        )}

        <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </div>

        <div className={`
          text-xs mt-1 flex items-center justify-end gap-1
          ${isOwn ? 'text-white/70' : 'text-gray-500'}
        `}>
          <span>{formatMessageTime(message.sent_at)}</span>
          {isOwn && getStatusIcon()}
        </div>
      </div>
    </div>
  );
}
