import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { ThreadedPost } from '@/utils/discussion-utils';
import { DiscussionInput } from './DiscussionInput';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { deletePost } from '@/lib/api';
import { toast } from 'sonner';
import useModeratorPermission from '@/hooks/useModeratorPermission';
import {
  CommentHeader,
  CommentContent,
  CommentActions,
  CommentReplies,
  DeleteCommentDialog,
  ReplyPreview
} from './comment';

interface ThreadedCommentProps {
  post: ThreadedPost;
  clubId: string;
  topicId: string;
  onSuccess: () => void;
  maxDepth?: number;
  isCollapsed?: boolean; // Allow parent to control collapsed state
  sessionKey?: string; // Used for persisting collapse state in session storage
}

const ThreadedComment: React.FC<ThreadedCommentProps> = ({
  post,
  clubId,
  topicId,
  onSuccess,
  maxDepth = 8, // Maximum depth to render before flattening
  isCollapsed: isCollapsedProp, // Prop to control collapsed state from parent
  sessionKey = 'discussion-collapse-state'
}) => {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [isCollapsedState, setIsCollapsedState] = useState(() => {
    // Initialize from session storage if available
    if (typeof window !== 'undefined') {
      const savedState = sessionStorage.getItem(`${sessionKey}-${post.id}`);
      if (savedState !== null) {
        return savedState === 'true';
      }
    }

    // Default behavior:
    // - Top-level comments (depth 0) are expanded
    // - All other comments (depth > 0) are collapsed by default
    return post.depth > 0;
  });

  // State to track if deep replies (grandchildren and beyond) should be collapsed
  const [areDeepRepliesCollapsed, setAreDeepRepliesCollapsed] = useState(() => {
    // Initialize from session storage if available
    if (typeof window !== 'undefined') {
      const savedState = sessionStorage.getItem(`${sessionKey}-deep-${post.id}`);
      if (savedState !== null) {
        return savedState === 'true';
      }
    }
    // Default to true for auto-collapsing deep replies (always)
    return true;
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const hasReplies = post.replies.length > 0;
  // Check if this post has any deep replies (grandchildren)
  const hasDeepReplies = post.replies.some(reply => reply.replies.length > 0);
  const effectiveDepth = Math.min(post.depth, maxDepth);

  // Use the prop value if provided, otherwise use the state
  const isCollapsed = isCollapsedProp !== undefined ? isCollapsedProp : isCollapsedState;

  // Check if current user is the author of the post
  const isAuthor = user?.id === post.user_id;

  // Check if current user has moderator permissions
  const { hasPermission: hasModeratorPermission } = useModeratorPermission(clubId);

  // Calculate indentation based on depth - limit to 3 levels max
  const effectiveIndentLevel = Math.min(effectiveDepth, 3); // Limit to 3 indent levels
  const indentationWidth = effectiveIndentLevel * 20; // 20px per level (increased from 16px)

  // Thread line colors - alternate between different shades with higher opacity
  const threadColors = [
    'border-bookconnect-sage/80',
    'border-bookconnect-terracotta/80',
    'border-bookconnect-brown/80',
    'border-bookconnect-cream/90'
  ];

  const threadColor = threadColors[effectiveDepth % threadColors.length];

  // Save collapse state to session storage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`${sessionKey}-${post.id}`, isCollapsedState.toString());
      sessionStorage.setItem(`${sessionKey}-deep-${post.id}`, areDeepRepliesCollapsed.toString());
    }
  }, [isCollapsedState, areDeepRepliesCollapsed, sessionKey, post.id]);

  // Handle toggling of all replies
  const handleToggleAllReplies = () => {
    // Only update our internal state if we're not controlled by a prop
    if (isCollapsedProp === undefined) {
      setIsCollapsedState(!isCollapsed);
    }

    // When expanding a collapsed thread with deep replies:
    // 1. Show direct replies
    // 2. Keep grandchildren and deeper replies collapsed
    if (isCollapsed && hasDeepReplies) {
      setAreDeepRepliesCollapsed(true);
    }
    // When collapsing an expanded thread:
    // No need to change deep replies state as they won't be visible anyway
  };

  // Handle toggling of deep replies only
  const handleToggleDeepReplies = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent handlers
    setAreDeepRepliesCollapsed(!areDeepRepliesCollapsed);
  };

  // Handle preview hover for collapsed threads
  const handlePreviewHover = () => {
    if (isCollapsed && hasReplies) {
      setIsHovering(true);
    }
  };

  const handlePreviewLeave = () => {
    setIsHovering(false);
  };

  // Handle post deletion
  const handleDelete = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      const result = await deletePost(user.id, post.id);

      // Update the post locally to avoid a full refresh
      if (result && result.success) {
        // Update the post with soft deletion info
        post.is_deleted = true;
        post.deleted_by_moderator = result.deleted_by_moderator;

        toast.success('Comment deleted successfully');
      } else {
        // If we didn't get the expected result, refresh the comments
        onSuccess();
      }
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
            "absolute border-l-2 top-0 bottom-0",
            threadColor
          )}
          style={{ left: `${indentationWidth - 12}px` }}
        />
      )}

      <div
        className="relative"
        style={{ marginLeft: `${indentationWidth}px` }}
        onMouseEnter={handlePreviewHover}
        onMouseLeave={handlePreviewLeave}
      >
        {/* Horizontal thread line connecting to the comment */}
        {post.depth > 0 && (
          <div
            className={cn(
              "absolute border-t-2 top-6 w-4",
              threadColor
            )}
            style={{ left: `-12px` }}
          />
        )}

        <Card
          className={cn(
            "p-2 mb-2 border shadow-sm transition-all duration-200 group",
            isCollapsed
              ? "border-gray-200 hover:border-bookconnect-sage/40"
              : "border-gray-100 hover:bg-gray-50/50"
          )}
        >
          <div className="flex flex-col">
            {/* Comment header */}
            <CommentHeader
              userId={post.user_id}
              createdAt={post.created_at}
              hasReplies={hasReplies}
              replyCount={post.replies.length}
              isCollapsed={isCollapsed}
              onToggleCollapse={handleToggleAllReplies}
            />

            {/* Comment content */}
            <CommentContent
              content={post.content}
              isDeleted={post.is_deleted}
              deletedByModerator={post.deleted_by_moderator}
            />

            {/* Comment actions */}
            <CommentActions
              postId={post.id}
              isReplying={isReplying}
              setIsReplying={setIsReplying}
              isNested={post.depth > 0}
              isDeleted={post.is_deleted || false}
              isAuthor={isAuthor}
              hasModeratorPermission={hasModeratorPermission}
              onDeleteClick={() => setShowDeleteDialog(true)}
              isDeleting={isDeleting}
              hasReplies={hasReplies}
              replyCount={post.replies.length}
              isCollapsed={isCollapsed}
              onToggleCollapse={handleToggleAllReplies}
            />

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

        {/* Render replies */}
        {!isCollapsed && hasReplies ? (
          <CommentReplies
            replies={post.replies}
            isCollapsed={isCollapsed}
            areDeepRepliesCollapsed={areDeepRepliesCollapsed}
            hasDeepReplies={hasDeepReplies}
            clubId={clubId}
            topicId={topicId}
            onSuccess={onSuccess}
            maxDepth={maxDepth}
            sessionKey={sessionKey}
            onToggleAllReplies={handleToggleAllReplies}
            onToggleDeepReplies={handleToggleDeepReplies}
            ThreadedCommentComponent={ThreadedComment}
          />
        ) : (
          isCollapsed && hasReplies && (
            <div
              className="flex items-center gap-1.5 ml-5 mb-2 mt-1 text-gray-500 hover:text-bookconnect-sage cursor-pointer w-fit"
              onClick={handleToggleAllReplies}
            >
              <span className="text-xs font-medium">
                Show {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
              </span>
            </div>
          )
        )}

        {/* Preview of first reply on hover when collapsed */}
        {isCollapsed && hasReplies && isHovering && post.replies.length > 0 && (
          <ReplyPreview reply={post.replies[0]} />
        )}
      </div>

      {/* Delete confirmation dialog */}
      <DeleteCommentDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        hasReplies={hasReplies}
        replyCount={post.replies.length}
      />
    </div>
  );
};

export default ThreadedComment;
