import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { MessageSquare, ChevronDown, ChevronRight, ChevronUp, ArrowUpRight, Trash2, AlertCircle } from 'lucide-react';
import UserName from '@/components/common/UserName';
import UserAvatar from '@/components/common/UserAvatar';
import { ThreadedPost } from '@/utils/discussion-utils';
import { DiscussionInput } from './DiscussionInput';
import PostReactions from './PostReactions';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { deletePost } from '@/lib/api';
import { toast } from 'sonner';


import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ThreadedCommentProps {
  post: ThreadedPost;
  clubId: string;
  topicId: string;
  onSuccess: () => void;
  maxDepth?: number;
  isCollapsed?: boolean; // Allow parent to control collapsed state
}

const ThreadedComment: React.FC<ThreadedCommentProps> = ({
  post,
  clubId,
  topicId,
  onSuccess,
  maxDepth = 8, // Maximum depth to render before flattening
  isCollapsed: isCollapsedProp // Prop to control collapsed state from parent
}) => {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [isCollapsedState, setIsCollapsedState] = useState(false);
  // New state to track if deep replies (grandchildren and beyond) should be collapsed
  const [areDeepRepliesCollapsed, setAreDeepRepliesCollapsed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const hasReplies = post.replies.length > 0;
  // Check if this post has any deep replies (grandchildren)
  const hasDeepReplies = post.replies.some(reply => reply.replies.length > 0);
  const effectiveDepth = Math.min(post.depth, maxDepth);

  // Use the prop value if provided, otherwise use the state
  const isCollapsed = isCollapsedProp !== undefined ? isCollapsedProp : isCollapsedState;

  // Check if current user is the author of the post
  const isAuthor = user?.id === post.user_id;

  // Calculate indentation based on depth - limit to 3 levels max
  const effectiveIndentLevel = Math.min(effectiveDepth, 3); // Limit to 3 indent levels
  const indentationWidth = effectiveIndentLevel * 16; // 16px per level

  // Thread line colors - alternate between different shades
  const threadColors = [
    'border-bookconnect-sage/60',
    'border-bookconnect-terracotta/60',
    'border-bookconnect-brown/60',
    'border-bookconnect-cream/80'
  ];

  const threadColor = threadColors[effectiveDepth % threadColors.length];

  // Handle toggling of all replies
  const handleToggleAllReplies = () => {
    // Only update our internal state if we're not controlled by a prop
    if (isCollapsedProp === undefined) {
      setIsCollapsedState(!isCollapsed);
    }

    // If we're expanding this thread and it has deep replies,
    // also collapse the deep replies to focus on immediate children
    if (isCollapsed && hasDeepReplies) {
      setAreDeepRepliesCollapsed(true);
    } else if (!isCollapsed) {
      // If we're collapsing, no need to change deep replies state
      // as they won't be visible anyway
    } else if (hasDeepReplies) {
      // Toggle deep replies state when clicking on a parent with deep replies
      setAreDeepRepliesCollapsed(!areDeepRepliesCollapsed);
    }
  };

  // Handle post deletion
  const handleDelete = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      await deletePost(user.id, post.id);
      toast.success('Comment deleted successfully');
      onSuccess(); // Refresh the comments
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="relative">
      {/* Thread line connecting to parent (not for top-level comments) */}
      {post.depth > 0 && (
        <div
          className={cn(
            "absolute border-l top-0 bottom-0",
            threadColor
          )}
          style={{ left: `${indentationWidth - 12}px` }}
        />
      )}

      <div
        className="relative"
        style={{ marginLeft: `${indentationWidth}px` }}
      >
        {/* Horizontal thread line connecting to the comment */}
        {post.depth > 0 && (
          <div
            className={cn(
              "absolute border-t top-6 w-3",
              threadColor
            )}
            style={{ left: `-12px` }}
          />
        )}

        <Card className="p-2 mb-2 border border-gray-100 shadow-sm hover:bg-gray-50/50 transition-colors group">
          <div className="flex flex-col">
            {/* Comment header */}
            <div className="flex items-start gap-1.5">
              <div
                className={cn(
                  "cursor-pointer flex flex-col items-center mr-0.5",
                  hasReplies ? "text-gray-300 hover:text-bookconnect-sage" : "text-gray-200"
                )}
                onClick={() => hasReplies && handleToggleAllReplies()}
              >
                <div className="h-4.5 w-4.5 flex items-center justify-center">
                  {hasReplies && (isCollapsed ?
                    <ChevronRight className="h-4.5 w-4.5" /> :
                    <ChevronDown className="h-4.5 w-4.5" />
                  )}
                </div>
                <div className="h-full w-0.5 bg-gray-100 my-0.5"></div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <UserAvatar userId={post.user_id} size="xs" />
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[0.85rem] font-medium text-gray-600">
                      <UserName userId={post.user_id} linkToProfile />
                    </span>
                    <span className="text-[0.75rem] text-gray-400 opacity-60 group-hover:opacity-100 transition-opacity">
                      {new Date(post.created_at).toLocaleString(undefined, {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comment content */}
            <div className="ml-5">
              <p className="mt-1.5 text-[0.95rem] leading-[1.4] text-gray-800 whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Comment actions - Compact style */}
            <div className="flex items-center gap-2 mt-1.5 ml-5 opacity-60 group-hover:opacity-100 transition-opacity">
              {/* Reactions */}
              <PostReactions postId={post.id} />

              {/* Action buttons */}
              <div className="flex items-center gap-2 text-gray-400">
                <button
                  className={cn(
                    "flex items-center justify-center transition-colors p-1.5 rounded min-w-[28px] min-h-[28px]",
                    isReplying
                      ? "text-white bg-bookconnect-sage hover:bg-bookconnect-sage/90"
                      : "text-gray-600 hover:bg-gray-100 hover:text-bookconnect-sage border border-gray-200"
                  )}
                  onClick={() => setIsReplying(!isReplying)}
                  title={isReplying ? "Cancel reply" : "Reply"}
                >
                  <MessageSquare className="h-4.5 w-4.5" />
                </button>

                {post.depth > 0 && (
                  <button
                    className="flex items-center justify-center p-1.5 rounded hover:bg-gray-100 min-w-[28px] min-h-[28px]"
                    onClick={() => {
                      // This would be used to navigate to parent comment
                      // For now just a visual element
                    }}
                    title="Go to parent"
                  >
                    <ArrowUpRight className="h-4.5 w-4.5" />
                  </button>
                )}

                {/* Delete button - only shown to the author */}
                {isAuthor && (
                  <button
                    className="flex items-center justify-center p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 min-w-[28px] min-h-[28px]"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isDeleting}
                    title="Delete comment"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                )}

                {hasReplies && (
                  <button
                    className="flex items-center p-1.5 rounded hover:bg-gray-100"
                    onClick={() => handleToggleAllReplies()}
                    title={isCollapsed ? "Show replies" : "Hide replies"}
                  >
                    <span className="text-xs">
                      {isCollapsed ? "Show" : "Hide"} {post.replies.length} {post.replies.length === 1 ? "reply" : "replies"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Reply form */}
            {isReplying && (
              <div className="mt-2 ml-5 mb-1 max-w-[95%]">
                <DiscussionInput
                  clubId={clubId}
                  topicId={topicId}
                  parentPostId={post.id}
                  onSuccess={() => {
                    setIsReplying(false);
                    onSuccess();
                  }}
                />
              </div>
            )}
          </div>
        </Card>

        {/* Render replies recursively if not collapsed */}
        {!isCollapsed && hasReplies && (
          <div className="replies mt-1">
            {/* Controls for managing replies */}
            <div className="flex items-center justify-between mb-1 ml-2">
              {post.replies.length > 5 && (
                <div className="text-sm text-gray-400 hover:text-bookconnect-sage cursor-pointer flex items-center" onClick={() => handleToggleAllReplies()}>
                  <ChevronUp className="h-4 w-4 mr-1" /> Collapse {post.replies.length} replies
                </div>
              )}

              {/* Toggle for deep replies */}
              {hasDeepReplies && (
                <div
                  className={`text-xs ${areDeepRepliesCollapsed ? 'text-bookconnect-sage' : 'text-gray-400'} hover:text-bookconnect-sage cursor-pointer flex items-center ml-auto`}
                  onClick={() => setAreDeepRepliesCollapsed(!areDeepRepliesCollapsed)}
                >
                  {areDeepRepliesCollapsed ? (
                    <>
                      <ChevronDown className="h-3.5 w-3.5 mr-1" />
                      Expand nested replies
                    </>
                  ) : (
                    <>
                      <ChevronUp className="h-3.5 w-3.5 mr-1" />
                      Collapse nested replies
                    </>
                  )}
                </div>
              )}
            </div>
            {post.replies.map(reply => (
              <React.Fragment key={reply.id}>
                <ThreadedComment
                  post={reply}
                  clubId={clubId}
                  topicId={topicId}
                  onSuccess={onSuccess}
                  maxDepth={maxDepth}
                  // Pass down the deep replies collapsed state to children
                  // Only if this is a direct child (depth = 1) and has its own replies
                  {...(areDeepRepliesCollapsed && reply.replies.length > 0
                    ? { isCollapsed: true }
                    : {}
                  )}
                />

                {/* Show indicator for collapsed deep replies */}
                {areDeepRepliesCollapsed && reply.replies.length > 0 && (
                  <div
                    className="text-xs text-gray-400 ml-8 mb-2 hover:text-bookconnect-sage cursor-pointer flex items-center"
                    onClick={() => setAreDeepRepliesCollapsed(false)}
                  >
                    <ChevronRight className="h-3.5 w-3.5 mr-1" />
                    <span className="italic">{reply.replies.length} nested {reply.replies.length === 1 ? 'reply' : 'replies'} hidden</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Show "View replies" link when collapsed */}
        {isCollapsed && hasReplies && (
          <div
            className="text-xs text-gray-400 ml-5 mb-2 hover:text-bookconnect-sage cursor-pointer flex items-center"
            onClick={() => handleToggleAllReplies()}
          >
            <ChevronRight className="h-4 w-4 mr-1" />
            View {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Delete Comment
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
              {hasReplies && (
                <p className="mt-2 text-amber-600 font-medium">
                  Note: This comment has {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'} that will remain visible.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ThreadedComment;
