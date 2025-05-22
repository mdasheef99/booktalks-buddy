import React from 'react';
import { Plus, Minus } from 'lucide-react';
import UserName from '@/components/common/UserName';
import UserAvatar from '@/components/common/UserAvatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CommentHeaderProps {
  userId: string;
  createdAt: string;
  hasReplies: boolean;
  replyCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const CommentHeader: React.FC<CommentHeaderProps> = ({
  userId,
  createdAt,
  hasReplies,
  replyCount,
  isCollapsed,
  onToggleCollapse,
}) => {
  return (
    <div className="flex items-start gap-1.5">
      <div
        className={cn(
          "cursor-pointer flex flex-col items-center mr-1",
          hasReplies
            ? "text-gray-400 hover:text-bookconnect-sage"
            : "text-gray-200"
        )}
        onClick={() => hasReplies && onToggleCollapse()}
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
          <UserAvatar userId={userId} size="xs" />
          <div className="flex items-baseline gap-1.5">
            <span className="text-[0.85rem] font-medium text-gray-600">
              <UserName userId={userId} linkToProfile showTierBadge={true} />
            </span>
            <span className="text-[0.75rem] text-gray-400 opacity-60 group-hover:opacity-100 transition-opacity">
              {new Date(createdAt).toLocaleString(undefined, {
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
                {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentHeader;
