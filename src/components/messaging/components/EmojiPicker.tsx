/**
 * EmojiPicker component for messaging system
 * Provides emoji selection functionality with popup interface
 */

import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker, { EmojiClickData, EmojiStyle, Theme } from 'emoji-picker-react';
import { Smile } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
  className?: string;
}

export function MessageEmojiPicker({ 
  onEmojiSelect, 
  disabled = false,
  className = ''
}: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current && 
        !pickerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close picker on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    setIsOpen(false);
  };

  const togglePicker = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Emoji Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={togglePicker}
        disabled={disabled}
        className={`
          p-2 rounded-lg transition-colors duration-200
          ${disabled 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 active:bg-gray-200'
          }
          ${isOpen ? 'bg-gray-100 text-gray-800' : ''}
        `}
        aria-label="Add emoji"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Smile size={20} />
      </button>

      {/* Emoji Picker Popup */}
      {isOpen && (
        <div 
          ref={pickerRef}
          className="absolute bottom-full right-0 mb-2 z-50 shadow-lg rounded-lg border border-gray-200 bg-white"
          role="dialog"
          aria-label="Emoji picker"
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            emojiStyle={EmojiStyle.NATIVE}
            theme={Theme.LIGHT}
            width={320}
            height={400}
            searchDisabled={false}
            skinTonesDisabled={false}
            previewConfig={{
              defaultEmoji: '1f60a',
              defaultCaption: 'Choose an emoji',
              showPreview: true
            }}
            categories={[
              {
                name: 'Smileys & People',
                category: 'smileys_people'
              },
              {
                name: 'Animals & Nature', 
                category: 'animals_nature'
              },
              {
                name: 'Food & Drink',
                category: 'food_drink'
              },
              {
                name: 'Activities',
                category: 'activities'
              },
              {
                name: 'Travel & Places',
                category: 'travel_places'
              },
              {
                name: 'Objects',
                category: 'objects'
              },
              {
                name: 'Symbols',
                category: 'symbols'
              },
              {
                name: 'Flags',
                category: 'flags'
              }
            ]}
          />
        </div>
      )}
    </div>
  );
}

export default MessageEmojiPicker;
