/**
 * MessageActions component for messaging system
 * Provides delete and reply actions for messages
 */

import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Reply, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageActionsProps {
  messageId: string;
  isOwn: boolean;
  onReply: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function MessageActions({
  messageId,
  isOwn,
  onReply,
  onDelete,
  disabled = false,
  className = ''
}: MessageActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowDeleteConfirm(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close menu on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setShowDeleteConfirm(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleReply = () => {
    onReply(messageId);
    setIsOpen(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(messageId);
    setIsOpen(false);
    setShowDeleteConfirm(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const toggleMenu = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Menu Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        disabled={disabled}
        className={`
          p-1.5 rounded-full transition-all duration-200
          opacity-60 group-hover:opacity-100 hover:opacity-100
          ${disabled
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-600 hover:text-gray-800 hover:bg-white/20 hover:shadow-sm active:bg-white/30'
          }
          ${isOpen ? 'opacity-100 bg-white/20 text-gray-800 shadow-sm' : ''}
        `}
        aria-label="Message actions"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <MoreVertical size={18} />
      </button>

      {/* Actions Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute top-full right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[120px]"
          role="menu"
          aria-label="Message actions menu"
        >
          {!showDeleteConfirm ? (
            <>
              {/* Reply Action */}
              <button
                onClick={handleReply}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                role="menuitem"
              >
                <Reply size={14} />
                Reply
              </button>

              {/* Delete Action - Only for own messages */}
              {isOwn && (
                <button
                  onClick={handleDeleteClick}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
                  role="menuitem"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
            </>
          ) : (
            /* Delete Confirmation */
            <div className="p-3">
              <p className="text-sm text-gray-700 mb-3">
                Delete this message?
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDeleteCancel}
                  className="flex-1 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleDeleteConfirm}
                  className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MessageActions;
