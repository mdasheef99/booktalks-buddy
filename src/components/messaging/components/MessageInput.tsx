/**
 * Direct Messaging System - Message Input Component
 *
 * Message composition component with character limit, send button,
 * and proper keyboard handling for message sending.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { MessageEmojiPicker } from './EmojiPicker';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

/**
 * Message input component with auto-resize and character limit
 */
export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
  maxLength = 1000,
  className = ''
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Auto-resize textarea based on content
   */
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  /**
   * Handle message sending
   */
  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSendMessage(trimmedMessage);
    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  /**
   * Handle keyboard events
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Handle input change with character limit
   */
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
    }
  };

  /**
   * Handle emoji selection
   */
  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.slice(0, start) + emoji + message.slice(end);

    if (newMessage.length <= maxLength) {
      setMessage(newMessage);

      // Set cursor position after emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    }
  };

  const charactersRemaining = maxLength - message.length;
  const isNearLimit = charactersRemaining <= 100;
  const canSend = message.trim().length > 0 && !disabled;

  return (
    <div className={`p-4 border-t bg-white ${className}`}>
      <div className={`
        flex gap-2 items-end transition-all duration-200
        ${isFocused ? 'ring-2 ring-bookconnect-sage/20 rounded-lg p-2' : ''}
      `}>
        {/* Message textarea */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className={`
              min-h-[40px] max-h-[120px] resize-none border-gray-300
              focus:border-bookconnect-sage focus:ring-bookconnect-sage
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            disabled={disabled}
            rows={1}
            aria-label="Type your message"
          />

          {/* Character count */}
          {(isNearLimit || isFocused) && (
            <div className={`
              absolute -top-6 right-0 text-xs
              ${charactersRemaining < 50 ? 'text-red-500' : 'text-gray-500'}
            `}>
              {charactersRemaining} characters remaining
            </div>
          )}
        </div>

        {/* Emoji picker */}
        <MessageEmojiPicker
          onEmojiSelect={handleEmojiSelect}
          disabled={disabled}
          className="flex-shrink-0"
        />

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={!canSend}
          size="sm"
          className={`
            flex-shrink-0 h-10 w-10 p-0
            ${canSend
              ? 'bg-bookconnect-sage hover:bg-bookconnect-sage/90'
              : 'bg-gray-300 cursor-not-allowed'
            }
          `}
          aria-label="Send message"
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Helper text */}
      {isFocused && (
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </div>
      )}
    </div>
  );
}

/**
 * Simple message input without advanced features
 */
export function SimpleMessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
  className = ''
}: Omit<MessageInputProps, 'maxLength'>) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSendMessage(trimmedMessage);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`p-4 border-t bg-white ${className}`}>
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-bookconnect-sage focus:border-bookconnect-sage"
          disabled={disabled}
          maxLength={1000}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="sm"
          className="bg-bookconnect-sage hover:bg-bookconnect-sage/90"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Message input with emoji picker (future enhancement)
 */
export function MessageInputWithEmoji({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
  className = ''
}: MessageInputProps) {
  // For now, this is the same as regular MessageInput
  // Can be enhanced with emoji picker in the future
  return (
    <MessageInput
      onSendMessage={onSendMessage}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
    />
  );
}

/**
 * Message input skeleton for loading states
 */
export function MessageInputSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 border-t bg-white animate-pulse ${className}`}>
      <div className="flex gap-2">
        <div className="flex-1 h-10 bg-gray-200 rounded"></div>
        <div className="w-10 h-10 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

/**
 * Disabled message input with explanation
 */
export function DisabledMessageInput({
  reason = "You cannot send messages in this conversation",
  className = ''
}: {
  reason?: string;
  className?: string;
}) {
  return (
    <div className={`p-4 border-t bg-gray-50 ${className}`}>
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-500">{reason}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Message input with typing indicator
 */
export function MessageInputWithTyping({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
  isTyping = false,
  typingUsers = [],
  className = ''
}: MessageInputProps & {
  isTyping?: boolean;
  typingUsers?: string[];
}) {
  return (
    <div className={className}>
      {/* Typing indicator */}
      {isTyping && typingUsers.length > 0 && (
        <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.join(', ')} are typing...`
              }
            </span>
          </div>
        </div>
      )}

      {/* Message input */}
      <MessageInput
        onSendMessage={onSendMessage}
        disabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );
}
