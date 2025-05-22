import React from 'react';
import { MessageSquare, ArrowUpRight, Trash2, Eye, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import PostReactions from '../PostReactions';

interface CommentActionsProps {
  postId: string;
  isReplying: boolean;
  setIsReplying: (isReplying: boolean) => void;
  isNested: boolean;
  isDeleted: boolean;
  isAuthor: boolean;
  hasModeratorPermission: boolean;
  onDeleteClick: () => void;
  isDeleting: boolean;
  hasReplies: boolean;
  replyCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const CommentActions: React.FC<CommentActionsProps> = ({
  postId,
  isReplying,
  setIsReplying,
  isNested,
  isDeleted,
  isAuthor,
  hasModeratorPermission,
  onDeleteClick,
  isDeleting,
  hasReplies,
  replyCount,
  isCollapsed,
  onToggleCollapse,
}) => {
  return (
    <div className="flex items-center gap-2 mt-2 ml-5 opacity-70 group-hover:opacity-100 transition-opacity">
      {/* Reactions */}
      <PostReactions postId={postId} />

      {/* Action buttons */}
      <div className="flex items-center gap-2 text-gray-400">
        <button
          className={cn(
            "flex items-center justify-center transition-colors p-1.5 rounded min-w-[32px] min-h-[32px]",
            isReplying
              ? "text-white bg-bookconnect-sage hover:bg-bookconnect-sage/90"
              : "text-gray-700 hover:bg-gray-100 hover:text-bookconnect-sage border border-gray-200"
          )}
          onClick={() => setIsReplying(!isReplying)}
          title={isReplying ? "Cancel reply" : "Reply"}
        >
          <MessageSquare className="h-5 w-5" />
        </button>

        {isNested && (
          <button
            className="flex items-center justify-center p-1.5 rounded hover:bg-gray-100 min-w-[32px] min-h-[32px] text-gray-500"
            onClick={() => {
              // This would be used to navigate to parent comment
              // For now just a visual element
            }}
            title="Go to parent"
          >
            <ArrowUpRight className="h-5 w-5" />
          </button>
        )}

        {/* Delete button - only shown to the author or moderators if not already deleted */}
        {!isDeleted && (isAuthor || hasModeratorPermission) && (
          <button
            className="flex items-center justify-center p-1.5 rounded text-gray-500 hover:text-red-500 hover:bg-red-50 min-w-[32px] min-h-[32px]"
            onClick={onDeleteClick}
            disabled={isDeleting}
            title="Delete comment"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}

        {hasReplies && (
          <button
            className={cn(
              "flex items-center gap-1 p-1.5 rounded hover:bg-gray-100 border",
              isCollapsed
                ? "border-bookconnect-sage/30 text-bookconnect-sage bg-bookconnect-sage/5"
                : "border-gray-200 text-gray-600"
            )}
            onClick={onToggleCollapse}
            title={isCollapsed ? "Show replies" : "Hide replies"}
          >
            {isCollapsed ? (
              <>
                <Eye className="h-4 w-4" />
                <span className="text-xs font-medium">
                  {replyCount} {replyCount === 1 ? "reply" : "replies"}
                </span>
              </>
            ) : (
              <>
                <ChevronUp className="h-4 w-4" />
                <span className="text-xs font-medium">Hide</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default CommentActions;
