import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, ChevronDown, ChevronRight, ArrowUpRight, Trash2, AlertCircle } from 'lucide-react';
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
}

const ThreadedComment: React.FC<ThreadedCommentProps> = ({
  post,
  clubId,
  topicId,
  onSuccess,
  maxDepth = 8 // Maximum depth to render before flattening
}) => {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const hasReplies = post.replies.length > 0;
  const effectiveDepth = Math.min(post.depth, maxDepth);

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
                onClick={() => hasReplies && setIsCollapsed(!isCollapsed)}
              >
                <div className="h-3.5 w-3.5 flex items-center justify-center">
                  {hasReplies && (isCollapsed ?
                    <ChevronRight className="h-3.5 w-3.5" /> :
                    <ChevronDown className="h-3.5 w-3.5" />
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
                    "flex items-center transition-colors p-1 rounded hover:bg-gray-100",
                    isReplying
                      ? "text-bookconnect-sage"
                      : "text-gray-400"
                  )}
                  onClick={() => setIsReplying(!isReplying)}
                  title={isReplying ? "Cancel reply" : "Reply"}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </button>

                {post.depth > 0 && (
                  <button
                    className="flex items-center p-1 rounded hover:bg-gray-100"
                    onClick={() => {
                      // This would be used to navigate to parent comment
                      // For now just a visual element
                    }}
                    title="Go to parent"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* Delete button - only shown to the author */}
                {isAuthor && (
                  <button
                    className="flex items-center p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isDeleting}
                    title="Delete comment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}

                {hasReplies && (
                  <button
                    className="flex items-center p-1 rounded hover:bg-gray-100"
                    onClick={() => setIsCollapsed(!isCollapsed)}
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
            {post.replies.length > 5 && !isCollapsed && (
              <div className="text-xs text-gray-400 mb-1 ml-2 hover:text-bookconnect-sage cursor-pointer" onClick={() => setIsCollapsed(true)}>
                ↑ Collapse {post.replies.length} replies
              </div>
            )}
            {post.replies.map(reply => (
              <ThreadedComment
                key={reply.id}
                post={reply}
                clubId={clubId}
                topicId={topicId}
                onSuccess={onSuccess}
                maxDepth={maxDepth}
              />
            ))}
          </div>
        )}

        {/* Show "View replies" link when collapsed */}
        {isCollapsed && hasReplies && (
          <div
            className="text-xs text-gray-400 ml-5 mb-2 hover:text-bookconnect-sage cursor-pointer flex items-center"
            onClick={() => setIsCollapsed(false)}
          >
            <ChevronRight className="h-3 w-3 mr-1" />
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
