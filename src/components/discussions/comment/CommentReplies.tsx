import React from 'react';
import { ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ThreadedPost } from '@/utils/discussion-utils';

interface CommentRepliesProps {
  replies: ThreadedPost[];
  isCollapsed: boolean;
  areDeepRepliesCollapsed: boolean;
  hasDeepReplies: boolean;
  clubId: string;
  topicId: string;
  onSuccess: () => void;
  maxDepth: number;
  sessionKey: string;
  onToggleAllReplies: () => void;
  onToggleDeepReplies: (e: React.MouseEvent) => void;
  ThreadedCommentComponent: React.ComponentType<any>; // Pass the ThreadedComment component to avoid circular imports
}

const CommentReplies: React.FC<CommentRepliesProps> = ({
  replies,
  isCollapsed,
  areDeepRepliesCollapsed,
  hasDeepReplies,
  clubId,
  topicId,
  onSuccess,
  maxDepth,
  sessionKey,
  onToggleAllReplies,
  onToggleDeepReplies,
  ThreadedCommentComponent,
}) => {
  if (isCollapsed) {
    return (
      <div
        className="flex items-center gap-1.5 ml-5 mb-2 mt-1 text-gray-500 hover:text-bookconnect-sage cursor-pointer w-fit"
        onClick={onToggleAllReplies}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="text-xs font-medium">
          Show {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
        </span>
      </div>
    );
  }

  return (
    <div className="replies mt-2">
      {/* Controls for managing deep replies */}
      <div className="flex items-center justify-between mb-2 ml-2">
        {replies.length > 3 && (
          <div
            className="text-sm text-gray-500 hover:text-bookconnect-sage cursor-pointer flex items-center bg-gray-50 px-2 py-1 rounded-md border border-gray-200"
            onClick={onToggleAllReplies}
          >
            <ChevronUp className="h-4 w-4 mr-1" /> Collapse all replies
          </div>
        )}

        {/* Toggle for deep replies */}
        {hasDeepReplies && (
          <div
            className={cn(
              "text-xs cursor-pointer flex items-center ml-auto px-2 py-1 rounded-md border",
              areDeepRepliesCollapsed
                ? "text-bookconnect-sage border-bookconnect-sage/30 bg-bookconnect-sage/5"
                : "text-gray-500 border-gray-200 bg-gray-50"
            )}
            onClick={onToggleDeepReplies}
          >
            {areDeepRepliesCollapsed ? (
              <>
                <ChevronDown className="h-3.5 w-3.5 mr-1" />
                Show nested replies
              </>
            ) : (
              <>
                <ChevronUp className="h-3.5 w-3.5 mr-1" />
                Hide nested replies
              </>
            )}
          </div>
        )}
      </div>

      {/* Replies container with subtle background to visually group them */}
      <div className={cn(
        "pl-2 py-1",
        hasDeepReplies && !areDeepRepliesCollapsed && "border-l-2 border-gray-100"
      )}>
        {replies.map(reply => (
          <React.Fragment key={reply.id}>
            <ThreadedCommentComponent
              post={reply}
              clubId={clubId}
              topicId={topicId}
              onSuccess={onSuccess}
              maxDepth={maxDepth}
              sessionKey={sessionKey}
              // Auto-collapse deep replies (level 3+)
              {...(
                // If deep replies are collapsed OR this is a level 3+ reply with its own replies
                (areDeepRepliesCollapsed && reply.replies.length > 0) ||
                (reply.depth >= 3 && reply.replies.length > 0)
                  ? { isCollapsed: true }
                  : {}
              )}
            />

            {/* Show indicator for collapsed deep replies */}
            {areDeepRepliesCollapsed && reply.replies.length > 0 && (
              <div
                className="flex items-center gap-1 ml-[calc(20px*2+4px)] mb-2 px-2 py-1 bg-gray-50/80 border border-gray-100 rounded-md text-gray-500 hover:text-bookconnect-sage hover:bg-gray-50 cursor-pointer w-fit"
                onClick={onToggleDeepReplies}
              >
                <ChevronDown className="h-3.5 w-3.5" />
                <Badge variant="outline" className="bg-bookconnect-sage/10 text-bookconnect-sage border-bookconnect-sage/30">
                  +{reply.replies.length}
                </Badge>
                <span className="text-xs font-medium">nested {reply.replies.length === 1 ? 'reply' : 'replies'}</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default CommentReplies;
