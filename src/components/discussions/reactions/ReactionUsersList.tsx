import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import UserName from '@/components/common/UserName';
import { ReactionUser } from '@/hooks/useReactionUsers';

export interface ReactionUsersListProps {
  reactionType: string;
  reactionCount: number;
  users: ReactionUser[];
  loading: boolean;
  currentUserId?: string;
  onClose: () => void;
  onRemoveReaction: (userId: string) => void;
}

/**
 * Component to display a list of users who reacted with a specific emoji
 */
const ReactionUsersList: React.FC<ReactionUsersListProps> = ({
  reactionType,
  reactionCount,
  users,
  loading,
  currentUserId,
  onClose,
  onRemoveReaction
}) => {
  return (
    <div className="flex flex-col gap-2 min-w-[180px]">
      <div className="flex items-center justify-between border-b pb-1 mb-1">
        <h4 className="text-sm font-medium flex items-center">
          <span className="mr-2">{reactionType}</span>
          <span className="text-gray-500 text-xs">
            {reactionCount} {reactionCount === 1 ? 'person' : 'people'}
          </span>
        </h4>
        <button
          className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="max-h-[200px] overflow-y-auto">
        {loading ? (
          <div className="py-2 text-center text-gray-500 text-sm">
            <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
            Loading users...
          </div>
        ) : users.length > 0 ? (
          users.map(reactionUser => {
            // Explicitly check if this is the current user's reaction
            const isCurrentUser = currentUserId && currentUserId === reactionUser.userId;

            return (
              <div
                key={reactionUser.userId}
                className={cn(
                  "flex items-center py-1.5 px-1 rounded hover:bg-gray-50",
                  isCurrentUser && "cursor-pointer hover:bg-red-50 border border-bookconnect-terracotta/20"
                )}
                onClick={() => {
                  if (isCurrentUser) {
                    onRemoveReaction(reactionUser.userId);
                  }
                }}
              >
                <div className="flex items-center">
                  <UserName
                    userId={reactionUser.userId}
                    linkToProfile={!isCurrentUser}
                    className={cn(
                      "text-sm",
                      isCurrentUser && "font-medium text-bookconnect-terracotta hover:text-red-500"
                    )}
                  />
                  {isCurrentUser && (
                    <span className="ml-1 text-xs bg-bookconnect-terracotta/10 text-bookconnect-terracotta px-1 py-0.5 rounded">You</span>
                  )}
                </div>
                {isCurrentUser && (
                  <span className="ml-auto text-xs text-red-400 hover:text-red-500">Remove</span>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-2 text-center text-gray-500 text-sm">
            No users found
          </div>
        )}
      </div>
    </div>
  );
};

export default ReactionUsersList;
