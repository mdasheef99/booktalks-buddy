import React from 'react';
import UserName from '@/components/common/UserName';
import UserAvatar from '@/components/common/UserAvatar';
import { ThreadedPost } from '@/utils/discussion-utils';

interface ReplyPreviewProps {
  reply: ThreadedPost;
}

const ReplyPreview: React.FC<ReplyPreviewProps> = ({ reply }) => {
  return (
    <div className="ml-5 mb-2 opacity-70 pointer-events-none">
      <div className="border-l-2 border-gray-200 pl-3 py-1">
        <div className="bg-gray-50/80 p-2 rounded-md border border-gray-100 max-w-[90%]">
          <div className="flex items-center gap-1.5 mb-1">
            <UserAvatar userId={reply.user_id} size="xxs" />
            <span className="text-[0.75rem] font-medium text-gray-600">
              <UserName userId={reply.user_id} showTierBadge={true} />
            </span>
          </div>
          <p className="text-[0.8rem] text-gray-600 line-clamp-2">
            {reply.content}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReplyPreview;
