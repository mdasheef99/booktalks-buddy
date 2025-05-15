import React from 'react';
import { cn } from '@/lib/utils';
import { ReactionCount } from '@/hooks/useReactions';

export interface EmojiPickerProps {
  availableReactions: Record<string, string>;
  currentReactions: ReactionCount[];
  onSelect: (reactionType: string) => void;
  disabled?: boolean;
}

/**
 * Component to display available emoji reactions
 */
const EmojiPicker: React.FC<EmojiPickerProps> = ({
  availableReactions,
  currentReactions,
  onSelect,
  disabled = false
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-gray-500 px-1">
        You can only add one reaction per comment
      </div>
      <div className="flex flex-wrap gap-1.5 max-w-[280px]">
        {Object.values(availableReactions).map(type => {
          // Check if user has already reacted with this emoji
          const hasReacted = currentReactions.some(r => r.type === type && r.userReacted);
          // Check if user has reacted with any emoji
          const hasAnyReaction = currentReactions.some(r => r.userReacted);
          // Get the current reaction type if any
          const currentReactionType = hasAnyReaction
            ? currentReactions.find(r => r.userReacted)?.type
            : null;

          return (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className={cn(
                "text-xl p-1.5 rounded transition-colors",
                hasReacted
                  ? "bg-bookconnect-sage/10 text-bookconnect-sage hover:bg-red-50 hover:text-red-500"
                  : hasAnyReaction && type !== currentReactionType
                    ? "hover:bg-gray-100 relative" // Different styling for when user has a different reaction
                    : "hover:bg-gray-100"
              )}
              disabled={disabled}
              title={
                hasReacted
                  ? `Remove ${type} reaction`
                  : hasAnyReaction && type !== currentReactionType
                    ? `Replace your ${currentReactionType} reaction with ${type}`
                    : `React with ${type}`
              }
              aria-label={`React with ${type}`}
            >
              {type}
              {hasAnyReaction && type !== currentReactionType && (
                <span className="absolute -top-1 -right-1 text-[10px] text-gray-500">
                  ↺
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EmojiPicker;
