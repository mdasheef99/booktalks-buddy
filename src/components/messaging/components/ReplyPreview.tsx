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
    <div className={`bg-gray-50 border-l-4 border-bookconnect-sage p-3 mx-4 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Replying to header */}
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs font-medium text-bookconnect-sage">
              Replying to
            </span>
            <UserName
              user={{
                id: replyingTo.sender_id,
                username: replyingTo.sender.username,
                displayname: replyingTo.sender.displayname
              }}
              showBoth={false}
              className="text-xs font-medium text-gray-700"
            />
          </div>
          
          {/* Original message content */}
          <div className="text-sm text-gray-600 leading-relaxed">
            {truncateContent(replyingTo.content)}
          </div>
        </div>
        
        {/* Cancel button */}
        <button
          onClick={onCancel}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          aria-label="Cancel reply"
        >
          <X size={16} />
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
        bg-gray-100 border-l-2 border-gray-300 p-2 mb-2 rounded-r-md cursor-pointer
        hover:bg-gray-150 transition-colors
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
      <div className="flex items-center gap-1 mb-1">
        <span className="text-xs text-gray-500">↳ Replying to</span>
        <UserName
          user={{
            username: repliedMessage.sender.username,
            displayname: repliedMessage.sender.displayname
          }}
          showBoth={false}
          className="text-xs font-medium text-gray-600"
        />
      </div>
      <div className="text-xs text-gray-600 leading-relaxed">
        {truncateContent(repliedMessage.content, 80)}
      </div>
    </div>
  );
}

export default ReplyPreview;
