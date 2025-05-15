import React from 'react';
import { cn } from '@/lib/utils';
import { ReactionCount } from '@/hooks/useReactions';

export interface ReactionCounterProps {
  reaction: ReactionCount;
  onClick: (reaction: ReactionCount) => void;
  disabled?: boolean;
}

/**
 * Component to display a single reaction with count
 */
const ReactionCounter: React.FC<ReactionCounterProps> = ({
  reaction,
  onClick,
  disabled = false
}) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(reaction);
      }}
      disabled={disabled}
      className={cn(
        "inline-flex items-center text-sm rounded-full px-2 py-1 transition-colors",
        reaction.userReacted
          ? "bg-bookconnect-sage/10 text-bookconnect-sage hover:bg-red-50 hover:text-red-500"
          : "text-gray-500 hover:bg-gray-100"
      )}
      title={`Click to see who reacted with ${reaction.type}`}
      aria-label={`${reaction.count} ${reaction.type} reactions`}
    >
      <span>{reaction.type}</span>
      <span className="ml-1 text-xs">{reaction.count}</span>
      {reaction.userReacted && (
        <span className="ml-1 text-xs opacity-70">✓</span>
      )}
    </button>
  );
};

export default ReactionCounter;
