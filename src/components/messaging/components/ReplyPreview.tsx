/**
 * ReplyPreview component for messaging system
 * Shows the message being replied to above the input field
 */

import React from 'react';
import { X } from 'lucide-react';
import { DMMessage } from '@/lib/api/messaging/types';
import { UserName } from './UserName';

interface ReplyPreviewProps {
  replyingTo: DMMessage;
  onCancel: () => void;
  className?: string;
}

/**
 * Truncate message content for preview
 */
function truncateContent(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
}

export function ReplyPreview({
  replyingTo,
  onCancel,
  className = ''
}: ReplyPreviewProps) {
  return (
    <div className={`bg-gradient-to-r from-bookconnect-sage/5 to-bookconnect-sage/10 border-l-4 border-bookconnect-sage p-4 mx-6 rounded-r-xl shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Replying to header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-bookconnect-sage">
              Replying to
            </span>
            <UserName
              user={{
                id: replyingTo.sender_id,
                username: replyingTo.sender.username,
                displayname: replyingTo.sender.displayname
              }}
              showBoth={false}
              className="text-sm font-semibold text-gray-700"
            />
          </div>

          {/* Original message content */}
          <div className="text-base text-gray-700 leading-relaxed font-medium">
            {truncateContent(replyingTo.content)}
          </div>
        </div>

        {/* Cancel button */}
        <button
          onClick={onCancel}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-full transition-all duration-200 hover:scale-105"
          aria-label="Cancel reply"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

/**
 * ReplyIndicator component for showing replied message in thread
 */
interface ReplyIndicatorProps {
  repliedMessage: {
    id: string;
    content: string;
    sender: {
      username: string;
      displayname: string;
    };
  };
  onClick?: () => void;
  className?: string;
}

export function ReplyIndicator({
  repliedMessage,
  onClick,
  className = ''
}: ReplyIndicatorProps) {
  return (
    <div
      className={`
        bg-gradient-to-r from-gray-50 to-gray-100/50 border-l-3 border-bookconnect-sage/60 p-3 mb-3 rounded-r-lg cursor-pointer
        hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:border-bookconnect-sage transition-all duration-200 hover:shadow-sm
        ${className}
      `}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-bookconnect-sage font-semibold">↳ Replying to</span>
        <UserName
          user={{
            username: repliedMessage.sender.username,
            displayname: repliedMessage.sender.displayname
          }}
          showBoth={false}
          className="text-sm font-semibold text-gray-700"
        />
      </div>
      <div className="text-sm text-gray-700 leading-relaxed font-medium">
        {truncateContent(repliedMessage.content, 80)}
      </div>
    </div>
  );
}

export default ReplyPreview;
