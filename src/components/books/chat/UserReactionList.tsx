import React from "react";
import { X, Trash2 } from "lucide-react";

interface UserReactionListProps {
  emoji: string;
  users: string[];
  isOpen: boolean;
  onClose: () => void;
  currentUsername?: string;
  onRemoveReaction?: () => void;
}

const UserReactionList: React.FC<UserReactionListProps> = ({
  emoji,
  users,
  isOpen,
  onClose,
  currentUsername,
  onRemoveReaction
}) => {
  // Debug log to see when this component is rendered and with what props
  console.log("UserReactionList - rendered with:", { emoji, users, isOpen });
  // Force the dialog to be visible if isOpen is true
  if (!isOpen) {
    return null;
  }

  // Use a simple modal div for maximum compatibility
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={(e) => {
        // Close when clicking the backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-serif text-bookconnect-brown">
            {emoji} Reactions ({users.length})
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-bookconnect-terracotta/10"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {currentUsername && users.includes(currentUsername) && onRemoveReaction && (
          <p className="text-xs text-gray-500 mt-2 mb-1 text-center">
            Your name is highlighted. Click on it to remove your reaction.
          </p>
        )}

        <div className="mt-2 max-h-60 overflow-y-auto">
          {users.length > 0 ? (
            <ul className="space-y-2">
              {users.map((username, index) => (
                <li
                  key={index}
                  className={`p-2 rounded-md ${username === currentUsername ? 'bg-bookconnect-cream/20 border border-bookconnect-terracotta/30' : 'hover:bg-bookconnect-cream/30'} text-bookconnect-brown flex justify-between items-center`}
                  onClick={username === currentUsername && onRemoveReaction ? () => onRemoveReaction() : undefined}
                  style={username === currentUsername && onRemoveReaction ? { cursor: 'pointer' } : {}}
                  title={username === currentUsername && onRemoveReaction ? "Click to remove your reaction" : ""}
                >
                  <span>{username}</span>
                  {username === currentUsername && onRemoveReaction && (
                    <span className="text-xs text-bookconnect-terracotta ml-2 flex items-center">
                      <span className="italic">Click to remove</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-4">No users have reacted with this emoji</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserReactionList;
