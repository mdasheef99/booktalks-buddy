import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { MessageSquare, ChevronDown, ChevronRight, ChevronUp, ArrowUpRight, Trash2, AlertCircle, Plus, Minus, Eye } from 'lucide-react';
import UserName from '@/components/common/UserName';
import UserAvatar from '@/components/common/UserAvatar';
import { ThreadedPost } from '@/utils/discussion-utils';
import { DiscussionInput } from './DiscussionInput';
import PostReactions from './PostReactions';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { deletePost } from '@/lib/api';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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
  const [showFullContent, setShowFullContent] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [contentOverflows, setContentOverflows] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const hasReplies = post.replies.length > 0;
  // Check if this post has any deep replies (grandchildren)
  const hasDeepReplies = post.replies.some(reply => reply.replies.length > 0);
  const effectiveDepth = Math.min(post.depth, maxDepth);

  // Count total nested replies (including deep replies)
  const totalNestedReplies = post.replies.reduce((count, reply) => {
    return count + 1 + (reply.replies ? reply.replies.length : 0);
  }, 0);

  // Use the prop value if provided, otherwise use the state
  const isCollapsed = isCollapsedProp !== undefined ? isCollapsedProp : isCollapsedState;

  // Check if current user is the author of the post
  const isAuthor = user?.id === post.user_id;

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

  // Check if content overflows and needs "Read more" button
  useEffect(() => {
    if (contentRef.current) {
      const { clientHeight, scrollHeight } = contentRef.current;
      setContentOverflows(scrollHeight > 200); // 200px threshold for "Read more"
    }
  }, [post.content]);

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
            <div className="flex items-start gap-1.5">
              <div
                className={cn(
                  "cursor-pointer flex flex-col items-center mr-1",
                  hasReplies
                    ? "text-gray-400 hover:text-bookconnect-sage"
                    : "text-gray-200"
                )}
                onClick={() => hasReplies && handleToggleAllReplies()}
              >
                <div className="h-5 w-5 flex items-center justify-center bg-gray-50 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors">
                  {hasReplies && (isCollapsed
                    ? <Plus className="h-3.5 w-3.5" />
                    : <Minus className="h-3.5 w-3.5" />
                  )}
                </div>
                {hasReplies && !isCollapsed && (
                  <div className="h-full w-0.5 bg-gray-100 my-0.5"></div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <UserAvatar userId={post.user_id} size="xs" />
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[0.85rem] font-medium text-gray-600">
                      <UserName userId={post.user_id} linkToProfile showTierBadge={true} />
                    </span>
                    <span className="text-[0.75rem] text-gray-400 opacity-60 group-hover:opacity-100 transition-opacity">
                      {new Date(post.created_at).toLocaleString(undefined, {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {hasReplies && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "ml-1.5 text-[0.65rem] py-0 px-1.5 h-4",
                          isCollapsed
                            ? "bg-bookconnect-sage/10 text-bookconnect-sage border-bookconnect-sage/30"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        )}
                      >
                        {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Comment content */}
            <div className="ml-5">
              <div
                className={cn(
                  "relative mt-1.5 overflow-hidden",
                  !showFullContent && contentOverflows && "max-h-[200px]"
                )}
              >
                <p
                  ref={contentRef}
                  className="text-[0.95rem] leading-[1.4] text-gray-800 whitespace-pre-wrap break-words overflow-wrap-anywhere"
                  style={{
                    wordBreak: "break-word",
                    overflowWrap: "break-word"
                  }}
                >
                  {post.content}
                </p>

                {/* Gradient fade for truncated content */}
                {!showFullContent && contentOverflows && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                )}
              </div>

              {/* Read more/less button */}
              {contentOverflows && (
                <button
                  onClick={() => setShowFullContent(!showFullContent)}
                  className="text-bookconnect-terracotta hover:text-bookconnect-terracotta/80 text-xs flex items-center mt-1"
                >
                  {showFullContent ? (
                    <>
                      Read less <ChevronUp className="h-3 w-3 ml-1" />
                    </>
                  ) : (
                    <>
                      Read more <ChevronDown className="h-3 w-3 ml-1" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Comment actions - Compact style */}
            <div className="flex items-center gap-2 mt-2 ml-5 opacity-70 group-hover:opacity-100 transition-opacity">
              {/* Reactions */}
              <PostReactions postId={post.id} />

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

                {post.depth > 0 && (
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

                {/* Delete button - only shown to the author */}
                {isAuthor && (
                  <button
                    className="flex items-center justify-center p-1.5 rounded text-gray-500 hover:text-red-500 hover:bg-red-50 min-w-[32px] min-h-[32px]"
                    onClick={() => setShowDeleteDialog(true)}
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
                    onClick={() => handleToggleAllReplies()}
                    title={isCollapsed ? "Show replies" : "Hide replies"}
                  >
                    {isCollapsed ? (
                      <>
                        <Eye className="h-4 w-4" />
                        <span className="text-xs font-medium">
                          {post.replies.length} {post.replies.length === 1 ? "reply" : "replies"}
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
          <div className="replies mt-2">
            {/* Controls for managing deep replies */}
            <div className="flex items-center justify-between mb-2 ml-2">
              {post.replies.length > 3 && (
                <div
                  className="text-sm text-gray-500 hover:text-bookconnect-sage cursor-pointer flex items-center bg-gray-50 px-2 py-1 rounded-md border border-gray-200"
                  onClick={() => handleToggleAllReplies()}
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
                  onClick={handleToggleDeepReplies}
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
              {post.replies.map(reply => (
                <React.Fragment key={reply.id}>
                  <ThreadedComment
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
                      onClick={handleToggleDeepReplies}
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
        )}

        {/* Show "View replies" link when collapsed */}
        {isCollapsed && hasReplies && (
          <div
            className="flex items-center gap-1.5 ml-5 mb-2 mt-1 text-gray-500 hover:text-bookconnect-sage cursor-pointer w-fit"
            onClick={() => handleToggleAllReplies()}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="text-xs font-medium">
              Show {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
            </span>
          </div>
        )}

        {/* Preview of first reply on hover when collapsed */}
        {isCollapsed && hasReplies && isHovering && post.replies.length > 0 && (
          <div className="ml-5 mb-2 opacity-70 pointer-events-none">
            <div className="border-l-2 border-gray-200 pl-3 py-1">
              <div className="bg-gray-50/80 p-2 rounded-md border border-gray-100 max-w-[90%]">
                <div className="flex items-center gap-1.5 mb-1">
                  <UserAvatar userId={post.replies[0].user_id} size="xxs" />
                  <span className="text-[0.75rem] font-medium text-gray-600">
                    <UserName userId={post.replies[0].user_id} showTierBadge={true} />
                  </span>
                </div>
                <p className="text-[0.8rem] text-gray-600 line-clamp-2">
                  {post.replies[0].content}
                </p>
              </div>
            </div>
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
