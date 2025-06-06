/**
 * Message Composition Component
 * 
 * Handles message input and submission for new conversations
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { getCharacterCountDisplay } from '../utils/conversationUtils';
import type { MessageCompositionProps } from '../types';

/**
 * Message Composition Component
 */
export const MessageComposition: React.FC<MessageCompositionProps> = ({
  selectedUser,
  message,
  isLoading,
  canInitiate,
  canSubmit,
  onMessageChange,
  onSubmit
}) => {
  const maxLength = 1000;
  const characterCount = getCharacterCountDisplay(message.length, maxLength);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (canSubmit) {
        onSubmit();
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Message
        </label>
        <Textarea
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={`Write your message to @${selectedUser.username}...`}
          className="min-h-[100px] resize-none"
          disabled={!canInitiate || isLoading}
          maxLength={maxLength}
        />
        
        <MessageFooter
          characterCount={characterCount}
          canSubmit={canSubmit}
          isLoading={isLoading}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
};

/**
 * Message Footer Component
 */
interface MessageFooterProps {
  characterCount: ReturnType<typeof getCharacterCountDisplay>;
  canSubmit: boolean;
  isLoading: boolean;
  onSubmit: () => void;
}

const MessageFooter: React.FC<MessageFooterProps> = ({
  characterCount,
  canSubmit,
  isLoading,
  onSubmit
}) => {
  return (
    <div className="flex justify-between items-center mt-2">
      <div className="flex flex-col">
        <p className={`text-xs ${
          characterCount.isOverLimit 
            ? 'text-red-500' 
            : characterCount.isNearLimit 
              ? 'text-amber-500' 
              : 'text-gray-500'
        }`}>
          {characterCount.text}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Tip: Press Ctrl+Enter to send
        </p>
      </div>
      
      <Button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="flex items-center gap-2 bg-bookconnect-sage hover:bg-bookconnect-sage/90"
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <Send className="h-4 w-4" />
        )}
        Send Message
      </Button>
    </div>
  );
};
